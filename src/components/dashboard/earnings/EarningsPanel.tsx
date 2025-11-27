"use client";

import type { EarningsDashboardData } from "@/lib/types";
import { ConnectStripeCard } from "./ConnectStripeCard";
import { EarningsSummaryCard } from "./EarningsSummaryCard";
import { PayoutsCard } from "./PayoutsCard";

interface EarningsPanelProps {
  data?: EarningsDashboardData | null;
  onConnectStripe?: () => void;
}

export function EarningsPanel({ data, onConnectStripe }: EarningsPanelProps) {
  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-sm uppercase text-text-muted tracking-wide">
          Loading earnings...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ConnectStripeCard
        connection={data.connection}
        onConnectClick={onConnectStripe}
      />
      <p className="text-xs text-text-muted max-w-2xl">
        Earnings are calculated in USD. We keep $3.33 per every $50 you make
        (nothing below $50), while Stripe charges a fixed 2.9% processing fee
        separately.
      </p>
      <EarningsSummaryCard
        currentPeriod={data.currentPeriod}
        lastThreePeriods={data.lastThreePeriods}
        allTimeGrossCents={data.allTimeGrossCents}
        allTimePlatformFeeCents={data.allTimePlatformFeeCents}
        allTimePayoutCents={data.allTimePayoutCents}
      />
      <PayoutsCard
        upcomingPayout={data.upcomingPayout ?? null}
        payoutHistory={data.payoutHistory}
        currentPeriod={data.currentPeriod}
      />
    </div>
  );
}
