import { query } from "../_generated/server";
import { v } from "convex/values";

// NOTE: This module intentionally contains only pure/read helpers for now.
// Stripe webhook handlers and payout runners should call into these helpers
// but live in their own Convex functions.

const THRESHOLD_CENTS = 5000; // $50 per block
const FEE_PER_BLOCK_CENTS = 333; // $3.33 keeps per $50 block

function getMonthRangeUtc(year: number, month: number) {
  const start = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const end = Date.UTC(year, month, 1, 0, 0, 0, 0);
  return { periodStart: start, periodEnd: end };
}

function getCurrentMonthRangeUtc() {
  const now = new Date();
  return getMonthRangeUtc(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

function computePlatformFee(grossCents: number): {
  platformFeeCents: number;
  payoutCents: number;
  thresholdReached: boolean;
  platformFeeRateBps: number;
} {
  if (grossCents < THRESHOLD_CENTS) {
    return {
      platformFeeCents: 0,
      payoutCents: grossCents,
      thresholdReached: false,
      platformFeeRateBps: 0,
    };
  }

  const blocks = Math.floor(grossCents / THRESHOLD_CENTS);
  const platformFeeCents = blocks * FEE_PER_BLOCK_CENTS;
  const payoutCents = grossCents - platformFeeCents;
  const platformFeeRateBps =
    grossCents > 0 ? Math.round((platformFeeCents / grossCents) * 10000) : 0;

  return {
    platformFeeCents,
    payoutCents,
    thresholdReached: true,
    platformFeeRateBps,
  };
}

// Internal helpers that can be reused by queries

async function getEarningsForPeriodInternal(
  ctx: any,
  args: { creatorSlug: string; periodStart: number; periodEnd: number }
) {
  const { creatorSlug, periodStart, periodEnd } = args;
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_creator_createdAt", (q: any) =>
      q
        .eq("creatorSlug", creatorSlug)
        .gte("createdAt", periodStart)
        .lt("createdAt", periodEnd)
    )
    .filter((q: any) => q.eq(q.field("status"), "succeeded"))
    .collect();

  const aggregate = payments.reduce(
    (acc: { gross: number; stripeFee: number; net: number }, p: any) => {
      acc.gross += p.amountGross;
      acc.stripeFee += p.stripeFeeCents ?? 0;
      acc.net += p.netCents ?? p.amountGross - (p.stripeFeeCents ?? 0);
      return acc;
    },
    { gross: 0, stripeFee: 0, net: 0 }
  );

  return {
    grossCents: aggregate.gross,
    stripeFeeCents: aggregate.stripeFee,
    netCents: aggregate.net,
    currency: "usd" as const,
  };
}

async function getCurrentPeriodSummaryInternal(ctx: any, creatorSlug: string) {
  const { periodStart, periodEnd } = getCurrentMonthRangeUtc();

  const { grossCents, stripeFeeCents } = await getEarningsForPeriodInternal(
    ctx,
    {
      creatorSlug,
      periodStart,
      periodEnd,
    }
  );

  const { platformFeeCents, thresholdReached, platformFeeRateBps } =
    computePlatformFee(grossCents);

  const payoutCents = Math.max(
    0,
    grossCents - platformFeeCents - stripeFeeCents
  );

  return {
    creatorSlug,
    periodStart,
    periodEnd,
    grossCents,
    stripeFeeCents,
    thresholdCents: THRESHOLD_CENTS,
    platformFeeRateBps,
    platformFeeCents,
    payoutCents,
    thresholdReached,
    netCents: Math.max(0, grossCents - stripeFeeCents),
  };
}

async function getLastThreePeriodsSummariesInternal(
  ctx: any,
  creatorSlug: string
) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-based

  const ranges: { periodStart: number; periodEnd: number }[] = [];
  for (let i = 1; i <= 3; i++) {
    const m = month - i;
    const d = new Date(Date.UTC(year, m - 1, 1));
    const { periodStart, periodEnd } = getMonthRangeUtc(
      d.getUTCFullYear(),
      d.getUTCMonth() + 1
    );
    ranges.push({ periodStart, periodEnd });
  }

  const results: any[] = [];
  for (const range of ranges) {
    const { grossCents, stripeFeeCents } = await getEarningsForPeriodInternal(
      ctx,
      {
        creatorSlug,
        periodStart: range.periodStart,
        periodEnd: range.periodEnd,
      }
    );

    const { platformFeeCents, thresholdReached, platformFeeRateBps } =
      computePlatformFee(grossCents);

    const payoutCents = Math.max(
      0,
      grossCents - platformFeeCents - stripeFeeCents
    );

    results.push({
      creatorSlug,
      periodStart: range.periodStart,
      periodEnd: range.periodEnd,
      grossCents,
      stripeFeeCents,
      thresholdCents: THRESHOLD_CENTS,
      platformFeeRateBps,
      platformFeeCents,
      payoutCents,
      thresholdReached,
      netCents: Math.max(0, grossCents - stripeFeeCents),
    });
  }

  return results;
}

async function getAllTimeEarningsInternal(ctx: any, creatorSlug: string) {
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_creator", (q: any) => q.eq("creatorSlug", creatorSlug))
    .filter((q: any) => q.eq(q.field("status"), "succeeded"))
    .collect();

  const { grossCents, stripeFeeCents } = payments.reduce(
    (acc: { grossCents: number; stripeFeeCents: number }, p: any) => {
      acc.grossCents += p.amountGross;
      acc.stripeFeeCents += p.stripeFeeCents ?? 0;
      return acc;
    },
    { grossCents: 0, stripeFeeCents: 0 }
  );

  // For v1, we recompute all-time platform fees using the same rule per
  // calendar month boundary to keep it consistent with monthly payouts.
  // NOTE: This is a derived value for display; payout records are the source
  // of truth for executed transfers.

  // Group payments by (year, month) UTC
  const byMonth = new Map<string, number>();
  for (const p of payments) {
    const d = new Date(p.createdAt);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    byMonth.set(key, (byMonth.get(key) || 0) + p.amountGross);
  }

  let platformFeeCents = 0;
  let payoutCents = 0;

  for (const [, monthGross] of byMonth) {
    const { platformFeeCents: f, payoutCents: pOut } =
      computePlatformFee(monthGross);
    platformFeeCents += f;
    payoutCents += pOut;
  }

  return {
    allTimeGrossCents: grossCents,
    allTimeStripeFeeCents: stripeFeeCents,
    allTimePlatformFeeCents: platformFeeCents,
    allTimePayoutCents: payoutCents - stripeFeeCents,
  };
}

// Public queries that wrap the helpers

export const getEarningsForPeriod = query({
  args: {
    creatorSlug: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    return getEarningsForPeriodInternal(ctx, args);
  },
});

export const getCurrentPeriodSummary = query({
  args: {
    creatorSlug: v.string(),
  },
  handler: async (ctx, args) => {
    return getCurrentPeriodSummaryInternal(ctx, args.creatorSlug);
  },
});

export const getLastThreePeriodsSummaries = query({
  args: {
    creatorSlug: v.string(),
  },
  handler: async (ctx, args) => {
    return getLastThreePeriodsSummariesInternal(ctx, args.creatorSlug);
  },
});

export const getAllTimeEarnings = query({
  args: {
    creatorSlug: v.string(),
  },
  handler: async (ctx, args) => {
    return getAllTimeEarningsInternal(ctx, args.creatorSlug);
  },
});

export const getEarningsDashboardData = query({
  args: {
    creatorSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const { creatorSlug } = args;
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q: any) => q.eq("slug", creatorSlug))
      .first();

    // Connection requires BOTH stripeAccountId AND completed onboarding (payoutEnabled)
    // This prevents showing "connected" before the user finishes Stripe onboarding
    const hasStripeAccount = !!creator?.stripeAccountId;
    const onboardingComplete = creator?.payoutEnabled ?? false;

    const connection = {
      connected: hasStripeAccount && onboardingComplete,
      stripeAccountId: creator?.stripeAccountId,
      detailsSubmitted: onboardingComplete,
      // New: expose whether account exists but onboarding is incomplete
      onboardingStarted: hasStripeAccount && !onboardingComplete,
    } as const;

    const currentPeriod = await getCurrentPeriodSummaryInternal(
      ctx,
      creatorSlug
    );
    const lastThreePeriods = await getLastThreePeriodsSummariesInternal(
      ctx,
      creatorSlug
    );
    const allTime = await getAllTimeEarningsInternal(ctx, creatorSlug);

    const payoutHistory = await ctx.db
      .query("payouts")
      .withIndex("by_creator_createdAt", (q: any) =>
        q.eq("creatorSlug", creatorSlug)
      )
      .order("desc")
      .take(50);

    const upcomingPayout =
      payoutHistory.find((p: any) => p.status === "pending") ?? null;

    return {
      connection,
      currentPeriod,
      lastThreePeriods,
      allTimeGrossCents: allTime.allTimeGrossCents,
      allTimeStripeFeeCents: allTime.allTimeStripeFeeCents,
      allTimePlatformFeeCents: allTime.allTimePlatformFeeCents,
      allTimePayoutCents: allTime.allTimePayoutCents,
      upcomingPayout,
      payoutHistory,
    };
  },
});
