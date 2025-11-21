import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { api } from "./_generated/api";

const MONTHLY_THRESHOLD_CENTS = 5000;
const PLATFORM_FEE_PER_BLOCK_CENTS = 333;

function getMonthRangeUtc(year: number, month: number) {
  const start = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const end = Date.UTC(year, month, 1, 0, 0, 0, 0);
  return { periodStart: start, periodEnd: end };
}

function computePlatformFee(grossCents: number) {
  if (grossCents < MONTHLY_THRESHOLD_CENTS) {
    return {
      platformFeeCents: 0,
      payoutCents: grossCents,
      thresholdReached: false,
    };
  }
  const blocks = Math.floor(grossCents / MONTHLY_THRESHOLD_CENTS);
  const platformFeeCents = blocks * PLATFORM_FEE_PER_BLOCK_CENTS;
  return {
    platformFeeCents,
    payoutCents: grossCents - platformFeeCents,
    thresholdReached: true,
  };
}

async function getGrossForCreator(
  ctx: any,
  creatorSlug: string,
  periodStart: number,
  periodEnd: number
) {
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_creator_createdAt", (q: any) =>
      q
        .eq("creatorSlug", creatorSlug)
        .gte("createdAt", periodStart)
        .lt("createdAt", periodEnd)
    )
    .collect();
  return payments.reduce(
    (sum: number, payment: any) => sum + payment.amountGross,
    0
  );
}

export const recordStripePayment = mutation({
  args: {
    creatorSlug: v.string(),
    amountGross: v.number(),
    currency: v.string(),
    externalId: v.string(),
    provider: v.string(),
    status: v.string(),
    ticketRef: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log("[Convex][recordStripePayment] incoming", {
      externalId: args.externalId,
      creatorSlug: args.creatorSlug,
      amount: args.amountGross,
    });
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (existing) {
      console.log(
        "[Convex][recordStripePayment] already exists, skipping insert",
        args.externalId
      );
      return { ok: true, paymentId: existing._id as string };
    }

    const createdAt = args.createdAt ?? Date.now();
    const insertedId = await ctx.db.insert("payments", {
      creatorSlug: args.creatorSlug,
      amountGross: args.amountGross,
      currency: args.currency,
      status: args.status,
      provider: args.provider,
      externalId: args.externalId,
      createdAt,
      ticketRef: args.ticketRef,
    });

    console.log("[Convex][recordStripePayment] inserted", insertedId);
    return { ok: true, paymentId: insertedId as string };
  },
});

// --- Helpers for Payout Action ---

export const getGrossForCreatorQuery = query({
  args: {
    creatorSlug: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    return getGrossForCreator(ctx, args.creatorSlug, args.periodStart, args.periodEnd);
  },
});

export const getPayoutByCreatorPeriod = query({
  args: {
    creatorSlug: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payouts")
      .withIndex("by_creator_period", (q) =>
        q
          .eq("creatorSlug", args.creatorSlug)
          .eq("periodStart", args.periodStart)
          .eq("periodEnd", args.periodEnd)
      )
      .unique();
  },
});

export const upsertPayoutRecord = mutation({
  args: {
    creatorSlug: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    grossCents: v.number(),
    platformFeeCents: v.number(),
    payoutCents: v.number(),
    stripeTransferId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("paid"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payouts")
      .withIndex("by_creator_period", (q) =>
        q
          .eq("creatorSlug", args.creatorSlug)
          .eq("periodStart", args.periodStart)
          .eq("periodEnd", args.periodEnd)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        grossCents: args.grossCents,
        platformFeeCents: args.platformFeeCents,
        payoutCents: args.payoutCents,
        stripeTransferId: args.stripeTransferId,
        status: args.status,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("payouts", {
        creatorSlug: args.creatorSlug,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        grossCents: args.grossCents,
        platformFeeCents: args.platformFeeCents,
        payoutCents: args.payoutCents,
        currency: "usd",
        stripeTransferId: args.stripeTransferId,
        status: args.status,
        createdAt: Date.now(),
      });
    }
  },
});

export const scheduleMonthlyPayouts = action({
  args: {
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, { year, month }) => {
    const { periodStart, periodEnd } = getMonthRangeUtc(year, month);

    // 1. Get all creators
    const creators = await ctx.runQuery(api.dashboard.getAllCreators);

    let processed = 0;
    let transfers = 0;

    for (const creator of creators) {
      if (!creator.stripeAccountId) continue;

      // 2. Calculate Gross
      // We need a query to get gross for creator. We can't use ctx.db in action.
      // We'll use a helper query exposed via api.
      const grossCents = await ctx.runQuery(api.payments.getGrossForCreatorQuery, {
        creatorSlug: creator.slug,
        periodStart,
        periodEnd,
      });

      if (grossCents === 0) continue;

      // 3. Calculate Fees
      const { platformFeeCents, payoutCents } = computePlatformFee(grossCents);

      // 4. Check if payout already exists
      const existing = await ctx.runQuery(api.payments.getPayoutByCreatorPeriod, {
        creatorSlug: creator.slug,
        periodStart,
        periodEnd,
      });

      if (existing && existing.status === "paid") {
        console.log(`Payout already paid for ${creator.slug}`);
        continue;
      }

      // 5. Perform Transfer (if not already done)
      let stripeTransferId = existing?.stripeTransferId;

      if (!stripeTransferId && payoutCents > 0) {
        try {
          const transfer = await stripe.transfers.create({
            amount: payoutCents,
            currency: "usd",
            destination: creator.stripeAccountId,
            metadata: {
              creatorSlug: creator.slug,
              period: `${year}-${month}`,
              type: "monthly_payout",
            },
          }, {
            idempotencyKey: `payout-${creator.slug}-${year}-${month}`,
          });
          stripeTransferId = transfer.id;
          transfers++;
        } catch (err) {
          console.error(`Transfer failed for ${creator.slug}`, err);
          // We continue to record the attempt, status will be failed/pending
        }
      }

      // 6. Record/Update Payout Record
      await ctx.runMutation(api.payments.upsertPayoutRecord, {
        creatorSlug: creator.slug,
        periodStart,
        periodEnd,
        grossCents,
        platformFeeCents,
        payoutCents,
        stripeTransferId,
        status: stripeTransferId ? "paid" : "failed",
      });

      processed++;
    }

    return { ok: true, processed, transfers };
  },
});

const stripeApiKey = process.env.STRIPE_API_KEY;
if (!stripeApiKey) {
  throw new Error("STRIPE_API_KEY is required for Stripe onboarding");
}

const stripe = new Stripe(stripeApiKey, { apiVersion: "2022-11-15" });

// V3: Manual Payment Intent (Hold funds)
export const createManualPaymentIntent = action({
  args: {
    creatorSlug: v.string(),
    ticketRef: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amountCents <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const creator = await ctx.runQuery(api.dashboard.getCreator, {
      creatorSlug: args.creatorSlug,
    });

    if (!creator || !creator.stripeAccountId) {
      throw new Error("Creator does not have a connected Stripe account");
    }

    // Create a PaymentIntent with capture_method: 'manual'
    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amountCents,
      currency: args.currency ?? "usd",
      capture_method: "manual", // <--- THE KEY DIFFERENCE
      metadata: {
        creatorSlug: args.creatorSlug,
        ticketRef: args.ticketRef,
      },
    });

    // Store the paymentIntentId on the ticket immediately
    await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
      ticketRef: args.ticketRef,
      paymentIntentId: paymentIntent.id,
      status: "requires_capture",
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  },
});

// V3: Manual Checkout Session (Redirect-based Hold)
export const createManualCheckoutSession = action({
  args: {
    creatorSlug: v.string(),
    ticketRef: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amountCents <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const creator = await ctx.runQuery(api.dashboard.getCreator, {
      creatorSlug: args.creatorSlug,
    });

    if (!creator || !creator.stripeAccountId) {
      throw new Error("Creator does not have a connected Stripe account");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: args.currency ?? "usd",
            product_data: {
              name: "Ticket tip",
            },
            unit_amount: args.amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        capture_method: "manual", // <--- THE KEY DIFFERENCE
        metadata: {
          creatorSlug: args.creatorSlug,
          ticketRef: args.ticketRef,
        },
      },
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        creatorSlug: args.creatorSlug,
        ticketRef: args.ticketRef,
      },
    });

    // Store the PaymentIntent ID on the ticket IMMEDIATELY (if available)
    // Note: For "payment" mode, session.payment_intent is populated on creation.
    if (session.payment_intent) {
      const piId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id;

      await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
        ticketRef: args.ticketRef,
        paymentIntentId: piId,
        status: "requires_capture", // It will be authorized once the user completes checkout
      });
    }

    return {
      url: session.url,
      id: session.id,
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
    };
  },
});

export const setPaymentIntentForTicket = mutation({
  args: {
    ticketRef: v.string(),
    paymentIntentId: v.string(),
    status: v.union(
      v.literal("requires_capture"),
      v.literal("succeeded"),
      v.literal("canceled"),
      v.literal("refunded")
    ),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ticketRef))
      .unique();

    if (!ticket) return;

    await ctx.db.patch(ticket._id, {
      paymentIntentId: args.paymentIntentId,
      paymentStatus: args.status,
    });
  },
});

// V3: Capture funds (Creator approves)
export const capturePaymentForTicket = action({
  args: {
    ticketRef: v.string(),
  },
  handler: async (ctx, args): Promise<{ ok: boolean; status: string }> => {
    const ticket = await ctx.runQuery(api.tickets.getByRef, { ref: args.ticketRef });
    if (!ticket) throw new Error("Ticket not found");
    if (!ticket.paymentIntentId) {
      // No payment attached (e.g. free ticket or legacy)
      return { ok: true, status: "no_payment" };
    }

    try {
      const paymentIntent = await stripe.paymentIntents.capture(ticket.paymentIntentId);

      if (paymentIntent.status === "succeeded") {
        // Record in payments table
        await ctx.runMutation(api.payments.recordStripePayment, {
          creatorSlug: ticket.creatorSlug,
          amountGross: paymentIntent.amount,
          currency: paymentIntent.currency,
          externalId: paymentIntent.id,
          provider: "stripe",
          status: "succeeded",
          ticketRef: ticket.ref,
        });

        // Update ticket status
        await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
          ticketRef: args.ticketRef,
          paymentIntentId: ticket.paymentIntentId,
          status: "succeeded",
        });

        // Mark ticket as approved in the main table
        await ctx.runMutation(api.tickets.approve, { ref: args.ticketRef });

        return { ok: true, status: "succeeded" };
      } else {
        return { ok: false, status: paymentIntent.status };
      }
    } catch (err: any) {
      console.error("Capture failed:", err);

      // Check for "already captured" error to make this idempotent
      const isAlreadyCaptured =
        err.code === 'payment_intent_unexpected_state' ||
        err.raw?.code === 'payment_intent_unexpected_state' ||
        err.message?.includes("already been captured");

      if (isAlreadyCaptured) {
        console.log("PaymentIntent was already captured. Verifying status...");
        const pi = await stripe.paymentIntents.retrieve(ticket.paymentIntentId);
        if (pi.status === 'succeeded') {
          // Ensure DB is in sync
          await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
            ticketRef: args.ticketRef,
            paymentIntentId: ticket.paymentIntentId,
            status: "succeeded",
          });

          // Mark ticket as approved in the main table
          await ctx.runMutation(api.tickets.approve, { ref: args.ticketRef });

          return { ok: true, status: "succeeded" };
        }
      }
      throw err;
    }
  },
});

// V3: Cancel/Refund funds (Creator rejects)
export const cancelOrRefundPaymentForTicket = action({
  args: {
    ticketRef: v.string(),
  },
  handler: async (ctx, args): Promise<{ ok: boolean; status?: string; action?: string }> => {
    const ticket = await ctx.runQuery(api.tickets.getByRef, { ref: args.ticketRef });
    if (!ticket) throw new Error("Ticket not found");
    if (!ticket.paymentIntentId) {
      return { ok: true, status: "no_payment" };
    }

    try {
      const pi = await stripe.paymentIntents.retrieve(ticket.paymentIntentId);

      if (pi.status === "requires_capture") {
        // Authorization only -> Cancel
        await stripe.paymentIntents.cancel(ticket.paymentIntentId);
        await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
          ticketRef: args.ticketRef,
          paymentIntentId: ticket.paymentIntentId,
          status: "canceled",
        });

        // Mark ticket as rejected in the main table
        await ctx.runMutation(api.tickets.reject, { ref: args.ticketRef });

        return { ok: true, action: "canceled" };
      } else if (pi.status === "succeeded") {
        // Already captured -> Refund
        await stripe.refunds.create({ payment_intent: ticket.paymentIntentId });
        // Update payments table record if it exists
        // (We'll rely on the webhook to mark the payment row as refunded, but we can update the ticket here)
        await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
          ticketRef: args.ticketRef,
          paymentIntentId: ticket.paymentIntentId,
          status: "refunded",
        });

        // Mark ticket as rejected in the main table
        await ctx.runMutation(api.tickets.reject, { ref: args.ticketRef });

        return { ok: true, action: "refunded" };
      } else if (pi.status === "canceled") {
        // Already canceled - ensure DB is in sync
        await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
          ticketRef: args.ticketRef,
          paymentIntentId: ticket.paymentIntentId,
          status: "canceled",
        });
        await ctx.runMutation(api.tickets.reject, { ref: args.ticketRef });
        return { ok: true, action: "canceled" };
      } else {
        return { ok: true, status: pi.status };
      }
    } catch (err) {
      console.error("Cancel/Refund failed:", err);
      throw err;
    }
  },
});

// Legacy or Simple Checkout (Immediate Capture)
export const createCheckoutSession = action({
  args: {
    creatorSlug: v.string(),
    ticketRef: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amountCents <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const creator = await ctx.runQuery(api.dashboard.getCreator, {
      creatorSlug: args.creatorSlug,
    });

    if (!creator || !creator.stripeAccountId) {
      throw new Error("Creator does not have a connected Stripe account");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: args.currency ?? "usd",
            product_data: {
              name: "Ticket tip",
            },
            unit_amount: args.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        creatorSlug: args.creatorSlug,
        ticketRef: args.ticketRef,
      },
    });

    return {
      url: session.url,
      id: session.id,
    };
  },
});
