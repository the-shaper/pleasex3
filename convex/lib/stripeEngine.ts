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
    grossCents > 0
      ? Math.round((platformFeeCents / grossCents) * 10000)
      : 0;

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

  const grossCents = payments.reduce(
    (sum: number, p: any) => sum + p.amountGross,
    0
  );

  return {
    grossCents,
    currency: "usd" as const,
  };
}

async function getCurrentPeriodSummaryInternal(
  ctx: any,
  creatorSlug: string
) {
  const { periodStart, periodEnd } = getCurrentMonthRangeUtc();

  const { grossCents } = await getEarningsForPeriodInternal(ctx, {
    creatorSlug,
    periodStart,
    periodEnd,
  });

  const { platformFeeCents, payoutCents, thresholdReached, platformFeeRateBps } =
    computePlatformFee(grossCents);

  return {
    creatorSlug,
    periodStart,
    periodEnd,
    grossCents,
    thresholdCents: THRESHOLD_CENTS,
    platformFeeRateBps,
    platformFeeCents,
    payoutCents,
    thresholdReached,
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
    const { grossCents } = await getEarningsForPeriodInternal(ctx, {
      creatorSlug,
      periodStart: range.periodStart,
      periodEnd: range.periodEnd,
    });

    const {
      platformFeeCents,
      payoutCents,
      thresholdReached,
      platformFeeRateBps,
    } =
      computePlatformFee(grossCents);

    results.push({
      creatorSlug,
      periodStart: range.periodStart,
      periodEnd: range.periodEnd,
      grossCents,
      thresholdCents: THRESHOLD_CENTS,
      platformFeeRateBps,
      platformFeeCents,
      payoutCents,
      thresholdReached,
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

  const grossCents = payments.reduce(
    (sum: number, p: any) => sum + p.amountGross,
    0
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
    allTimePlatformFeeCents: platformFeeCents,
    allTimePayoutCents: payoutCents,
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

    const connection = {
      connected: !!creator?.stripeAccountId,
      stripeAccountId: creator?.stripeAccountId,
      detailsSubmitted: creator?.payoutEnabled ?? false,
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

    const upcomingPayout = payoutHistory.find(
      (p: any) => p.status === "pending"
    ) ?? null;

    return {
      connection,
      currentPeriod,
      lastThreePeriods,
      allTimeGrossCents: allTime.allTimeGrossCents,
      allTimePlatformFeeCents: allTime.allTimePlatformFeeCents,
      allTimePayoutCents: allTime.allTimePayoutCents,
      upcomingPayout,
      payoutHistory,
    };
  },
});
