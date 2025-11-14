"use client";

import type { PayoutRecord } from "@/lib/types";

interface PayoutsCardProps {
  upcomingPayout: PayoutRecord | null;
  payoutHistory: PayoutRecord[];
}

const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const formatPeriodLabel = (record: PayoutRecord) => {
  const start = new Date(record.periodStart);
  const label = `${start.getUTCFullYear()}-${String(
    start.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  return label;
};

export function PayoutsCard({ upcomingPayout, payoutHistory }: PayoutsCardProps) {
  return (
    <section className="border border-text/20 bg-bg px-6 py-4 flex flex-col gap-4">
      <div>
        <div className="text-xs uppercase text-text-muted tracking-wide">
          Next payout
        </div>
        {upcomingPayout ? (
          <div className="mt-1 flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-text-muted text-xs uppercase">Period</div>
              <div className="text-text font-semibold">
                {formatPeriodLabel(upcomingPayout)}
              </div>
            </div>
            <div>
              <div className="text-text-muted text-xs uppercase">Payout</div>
              <div className="text-text font-semibold">
                {formatMoney(upcomingPayout.payoutCents)}
              </div>
            </div>
            <div>
              <div className="text-text-muted text-xs uppercase">Status</div>
              <div className="text-text font-semibold">{upcomingPayout.status}</div>
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
                key={p.id}
                className="flex justify-between border-t border-text/10 pt-1"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="uppercase text-text-muted">
                    {formatPeriodLabel(p)}
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
                    <div className="mt-1">Transfer {p.stripeTransferId.slice(-6)}</div>
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

