"use client";

import type { PayoutRecord, CreatorEarningsSummary } from "@/lib/types";

interface PayoutsCardProps {
  upcomingPayout: PayoutRecord | null;
  payoutHistory: PayoutRecord[];
  currentPeriod?: CreatorEarningsSummary;
}

const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const formatPeriodLabel = (dateOrStr: string | number) => {
  const start = new Date(dateOrStr);
  return start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

const getExpectedPayoutDate = (periodStart: number) => {
  const start = new Date(periodStart);
  // Add 1 month to get the 1st of the next month
  const nextMonth = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
  );
  return nextMonth.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export function PayoutsCard({
  upcomingPayout,
  payoutHistory,
  currentPeriod,
}: PayoutsCardProps) {
  // Determine what to show for "Next payout"
  // 1. If there's an official pending payout in DB, show that.
  // 2. Else if we have current period earnings > 0, show that as "Projected".
  // 3. Else show empty state.

  let displayPayout = null;
  let isProjected = false;

  if (upcomingPayout) {
    displayPayout = {
      periodLabel: formatPeriodLabel(upcomingPayout.periodStart),
      amount: upcomingPayout.payoutCents,
      statusLabel: "Status",
      statusValue: upcomingPayout.status,
    };
  } else if (currentPeriod && currentPeriod.payoutCents > 0) {
    const expectedDate = getExpectedPayoutDate(currentPeriod.periodStart);
    displayPayout = {
      periodLabel: formatPeriodLabel(currentPeriod.periodStart),
      amount: currentPeriod.payoutCents,
      statusLabel: "Expected by",
      statusValue: expectedDate,
    };
    isProjected = true;
  }

  return (
    <section className="border border-text/20 bg-bg px-6 py-4 flex flex-col gap-4">
      <div>
        <div className="text-md uppercase text-text-muted tracking-wide font-bold">
          Next payout
        </div>
        {displayPayout ? (
          <div className="mt-1 flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-text-muted text-xs uppercase">
                Earnings For
              </div>
              <div className="text-text font-semibold">
                {displayPayout.periodLabel}
              </div>
            </div>
            <div>
              <div className="text-text-muted text-xs uppercase">Payout</div>
              <div className="text-text font-semibold">
                {formatMoney(displayPayout.amount)}
              </div>
            </div>
            <div>
              <div className="text-text-muted text-xs uppercase">
                {displayPayout.statusLabel}
              </div>
              <div className="text-text font-semibold">
                {displayPayout.statusValue}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-1 text-xs text-text-muted">
            No pending payout yet. Once your monthly gross reaches $50 or more,
            we will schedule it for the next payout run.
          </div>
        )}
      </div>

      <div>
        <div className="text-xs uppercase text-text-muted tracking-wide">
          Payout history
        </div>
        {payoutHistory.length === 0 ? (
          <div className="mt-1 text-xs text-text-muted">
            No payouts have been executed yet.
          </div>
        ) : (
          <div className="mt-1 flex flex-col gap-1 text-xs">
            {payoutHistory.map((p) => (
              <div
                key={p._id}
                className="flex justify-between border-t border-text/10 pt-1"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="uppercase text-text-muted">
                    {formatPeriodLabel(p.periodStart)}
                  </span>
                  <span className="text-text">
                    Payout {formatMoney(p.payoutCents)} • Gross{" "}
                    {formatMoney(p.grossCents)} • Fee{" "}
                    {formatMoney(p.platformFeeCents)}
                  </span>
                </div>
                <div className="text-right text-text-muted text-[10px]">
                  {p.status}
                  {p.stripeTransferId && (
                    <div className="mt-1">
                      Transfer {p.stripeTransferId.slice(-6)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

