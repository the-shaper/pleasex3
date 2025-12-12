import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const crons = cronJobs();

// Constants for timing
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Run every hour to check for pending tickets
crons.hourly(
  "check-pending-tickets",
  { minuteUTC: 0 },
  internal.crons.processPendingTickets
);

// Run on the 1st of each month (UTC) to pay out the previous month (all envs)
crons.monthly(
  "run-monthly-payouts",
  { hourUTC: 1, minuteUTC: 0, day: 1 },
  internal.crons.runMonthlyPayouts,
  {}
);

export default crons;

// Internal action to process pending tickets
export const processPendingTickets = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threeDaysAgo = now - THREE_DAYS_MS;
    const sevenDaysAgo = now - SEVEN_DAYS_MS;

    // Get all open tickets with payment intents (paid requests awaiting approval)
    const pendingTickets = await ctx.runQuery(
      internal.crons.getPendingTicketsForProcessing,
      {}
    );

    console.log(`[Cron] Processing ${pendingTickets.length} pending tickets`);

    // Group tickets by creator for reminder emails
    const ticketsByCreator: Record<
      string,
      {
        creatorSlug: string;
        creatorEmail?: string;
        creatorName?: string;
        tickets: typeof pendingTickets;
      }
    > = {};

    for (const ticket of pendingTickets) {
      const age = now - ticket.createdAt;

      // Auto-expire tickets older than 7 days
      if (age >= SEVEN_DAYS_MS) {
        console.log(
          `[Cron] Auto-expiring ticket ${ticket.ref} (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`
        );

        // Cancel the PaymentIntent if it exists
        if (ticket.paymentIntentId) {
          try {
            await ctx.runAction(internal.crons.cancelPaymentIntent, {
              paymentIntentId: ticket.paymentIntentId,
            });
          } catch (err) {
            console.error(
              `[Cron] Failed to cancel PaymentIntent for ${ticket.ref}:`,
              err
            );
          }
        }

        // Mark ticket as expired
        await ctx.runMutation(internal.tickets.rejectExpired, {
          ref: ticket.ref,
        });
        continue;
      }

      // Send 3-day reminder if not already sent
      if (age >= THREE_DAYS_MS && !ticket.reminderSentAt) {
        if (!ticketsByCreator[ticket.creatorSlug]) {
          ticketsByCreator[ticket.creatorSlug] = {
            creatorSlug: ticket.creatorSlug,
            creatorEmail: ticket.creatorEmail,
            creatorName: ticket.creatorName,
            tickets: [],
          };
        }
        ticketsByCreator[ticket.creatorSlug].tickets.push(ticket);
      }
    }

    // Send reminder emails to creators
    for (const [creatorSlug, data] of Object.entries(ticketsByCreator)) {
      if (!data.creatorEmail) {
        console.log(
          `[Cron] No email for creator ${creatorSlug}, skipping reminder`
        );
        continue;
      }

      // Find oldest ticket for the email
      const oldestTicket = data.tickets.reduce((oldest, t) =>
        t.createdAt < oldest.createdAt ? t : oldest
      );
      const daysOld = Math.floor(
        (now - oldestTicket.createdAt) / (24 * 60 * 60 * 1000)
      );

      console.log(
        `[Cron] Sending reminder to ${creatorSlug} for ${data.tickets.length} pending tickets`
      );

      // Send reminder email
      await ctx.runAction(internal.emails.sendCreatorPendingReminder, {
        email: data.creatorEmail,
        creatorName: data.creatorName || creatorSlug,
        pendingCount: data.tickets.length,
        oldestTicketRef: oldestTicket.ref,
        daysOld,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${creatorSlug}/dashboard?tab=active`,
      });

      // Mark reminders as sent for all tickets
      for (const ticket of data.tickets) {
        await ctx.runMutation(internal.tickets.markReminderSent, {
          ref: ticket.ref,
        });
      }
    }
  },
});

// Query to get pending tickets with creator info
import { internalQuery } from "./_generated/server";

export const getPendingTicketsForProcessing = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all open/pending_payment tickets
    const tickets = await ctx.db
      .query("tickets")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "open"),
          q.eq(q.field("status"), "pending_payment")
        )
      )
      .collect();

    // Enrich with creator info
    const result = [];
    for (const ticket of tickets) {
      const creator = await ctx.db
        .query("creators")
        .withIndex("by_slug", (q) => q.eq("slug", ticket.creatorSlug))
        .first();

      result.push({
        ref: ticket.ref,
        creatorSlug: ticket.creatorSlug,
        createdAt: ticket.createdAt,
        paymentIntentId: ticket.paymentIntentId,
        reminderSentAt: ticket.reminderSentAt,
        creatorEmail: creator?.email,
        creatorName: creator?.displayName,
      });
    }

    return result;
  },
});

// Action to cancel a PaymentIntent via Stripe
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2022-11-15",
});

export const cancelPaymentIntent = internalAction({
  args: { paymentIntentId: v.string() },
  handler: async (ctx, { paymentIntentId }) => {
    try {
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      // Only cancel if still capturable
      if (paymentIntent.status === "requires_capture") {
        await stripe.paymentIntents.cancel(paymentIntentId);
        console.log(`[Cron] Cancelled PaymentIntent ${paymentIntentId}`);
      } else {
        console.log(
          `[Cron] PaymentIntent ${paymentIntentId} not capturable (status: ${paymentIntent.status})`
        );
      }
    } catch (err: any) {
      // PaymentIntent may have already been canceled or captured
      if (err.code === "payment_intent_unexpected_state") {
        console.log(
          `[Cron] PaymentIntent ${paymentIntentId} already in final state`
        );
      } else {
        throw err;
      }
    }
  },
});

// --- Monthly payouts (dev only) ---

function getPreviousMonthUtc(now: Date) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-based
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

export const runMonthlyPayouts = internalAction({
  args: {},
  handler: async (ctx) => {
    if (process.env.CONVEX_PAYOUTS_DISABLED === "true") {
      console.log("[Cron][Payouts] Skipping because payouts are disabled");
      return;
    }

    const { year, month } = getPreviousMonthUtc(new Date());
    console.log(
      `[Cron][Payouts] Running scheduleMonthlyPayouts for ${year}-${month}`
    );

    await ctx.runAction(api.payments.scheduleMonthlyPayouts, {
      year,
      month,
    });
  },
});
