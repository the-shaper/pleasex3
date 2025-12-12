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
      {/* Title */}
      <h2
        className="text-xl  font-bold text-left uppercase tracking-tight border-b border-gray-subtle pb-2 sticky top-0 z-10 bg-bg"
        style={{ fontFamily: "var(--font-body)" }}
      >
        EARNINGS
      </h2>
      <ConnectStripeCard
        connection={data.connection}
        onConnectClick={onConnectStripe}
      />

      <EarningsSummaryCard
        currentPeriod={data.currentPeriod}
        lastThreePeriods={data.lastThreePeriods}
        allTimeGrossCents={data.allTimeGrossCents}
        allTimeStripeFeeCents={data.allTimeStripeFeeCents}
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
