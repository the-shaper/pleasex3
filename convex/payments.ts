import { mutation } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

const MONTHLY_THRESHOLD_CENTS = 5000;
const PLATFORM_FEE_BPS = 330;

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
  const platformFeeCents = Math.round((grossCents * PLATFORM_FEE_BPS) / 10000);
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
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (existing) {
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

    return { ok: true, paymentId: insertedId as string };
  },
});

export const scheduleMonthlyPayouts = mutation({
  args: {
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, { year, month }) => {
    const { periodStart, periodEnd } = getMonthRangeUtc(year, month);

    const creators = await ctx.db.query("creators").collect();

    let created = 0;
    for (const creator of creators) {
      if (!creator.stripeAccountId) continue;

      const grossCents = await getGrossForCreator(
        ctx,
        creator.slug,
        periodStart,
        periodEnd
      );
      if (grossCents === 0) continue;

      const { platformFeeCents, payoutCents } = computePlatformFee(grossCents);

      const existing = await ctx.db
        .query("payouts")
        .withIndex("by_creator_period", (q) =>
          q
            .eq("creatorSlug", creator.slug)
            .eq("periodStart", periodStart)
            .eq("periodEnd", periodEnd)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          grossCents,
          platformFeeCents,
          payoutCents,
          status: "pending",
        });
        continue;
      }

      await ctx.db.insert("payouts", {
        creatorSlug: creator.slug,
        periodStart,
        periodEnd,
        grossCents,
        platformFeeCents,
        payoutCents,
        currency: "usd",
        status: "pending",
        createdAt: Date.now(),
      });
      created += 1;
    }

    return { ok: true, created };
  },
});

const stripeApiKey = process.env.STRIPE_API_KEY;
if (!stripeApiKey) {
  throw new Error("STRIPE_API_KEY is required for Stripe onboarding");
}

const stripe = new Stripe(stripeApiKey, { apiVersion: "2022-11-15" });

export const createCheckoutSession = mutation({
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

    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.creatorSlug))
      .unique();

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

