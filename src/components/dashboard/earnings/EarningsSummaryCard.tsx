"use client";

import type { CreatorEarningsSummary } from "@/lib/types";

interface EarningsSummaryCardProps {
  currentPeriod: CreatorEarningsSummary;
  lastThreePeriods: CreatorEarningsSummary[];
  allTimeGrossCents: number;
  allTimePlatformFeeCents: number;
  allTimePayoutCents: number;
}

const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function EarningsSummaryCard({
  currentPeriod,
  lastThreePeriods,
  allTimeGrossCents,
  allTimePlatformFeeCents,
  allTimePayoutCents,
}: EarningsSummaryCardProps) {
  const thresholdLabel = formatMoney(currentPeriod.thresholdCents);

  return (
    <section className="border border-text/20 bg-bg px-6 py-4 flex flex-col gap-4">
      <div>
        <div className="text-xs uppercase text-text-muted">This month</div>
        <div className="flex flex-wrap gap-8 mt-1 text-sm">
          <div>
            <div className="text-text-muted text-xs uppercase">Gross</div>
            <div className="text-text font-semibold">
              {formatMoney(currentPeriod.grossCents)}
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs uppercase">Platform fee</div>
            <div className="text-text font-semibold">
              {currentPeriod.platformFeeCents === 0
                ? "0 (below $50)"
                : `${formatMoney(
                    currentPeriod.platformFeeCents
                  )} ($3.33 per $50 block)`}
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs uppercase">Projected payout</div>
            <div className="text-text font-semibold">
              {formatMoney(currentPeriod.payoutCents)}
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs uppercase">Threshold</div>
            <div className="text-text font-semibold">{thresholdLabel}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase text-text-muted">Last three months</div>
        <div className="mt-1 flex flex-col gap-1 text-xs">
          {lastThreePeriods.length === 0 && (
            <div className="text-text-muted">No previous months yet.</div>
          )}
          {lastThreePeriods.map((p) => {
            const start = new Date(p.periodStart);
            const label = `${start.getUTCFullYear()}-${String(
              start.getUTCMonth() + 1,
            ).padStart(2, "0")}`;
            return (
              <div
                key={`${p.periodStart}-${p.periodEnd}`}
                className="flex justify-between text-text"
              >
                <div className="flex gap-4">
                  <span className="uppercase text-text-muted">{label}</span>
                  <span>Gross {formatMoney(p.grossCents)}</span>
                </div>
                <div className="flex gap-4">
                  <span>Fee {formatMoney(p.platformFeeCents)}</span>
                  <span>Payout {formatMoney(p.payoutCents)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase text-text-muted">All time</div>
        <div className="mt-1 flex flex-wrap gap-8 text-sm">
          <div>
            <div className="text-text-muted text-xs uppercase">Gross</div>
            <div className="text-text font-semibold">
              {formatMoney(allTimeGrossCents)}
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs uppercase">Platform fees</div>
            <div className="text-text font-semibold">
              {formatMoney(allTimePlatformFeeCents)}
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs uppercase">Payouts</div>
            <div className="text-text font-semibold">
              {formatMoney(allTimePayoutCents)}
            </div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-text-muted">
        Platform fees follow the $3.33-per-$50 rule above. Stripe’s payment
        processing fee (fixed 2.9%) is charged separately.
      </p>
    </section>
  );
}

