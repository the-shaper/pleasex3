"use client";

import type { StripeConnectionStatus } from "@/lib/types";

interface ConnectStripeCardProps {
  connection: StripeConnectionStatus;
  onConnectClick?: () => void;
}

export function ConnectStripeCard({
  connection,
  onConnectClick,
}: ConnectStripeCardProps) {
  if (!connection.connected) {
    return (
      <section className="border border-text/20 bg-bg px-6 py-4 flex flex-col gap-2">
        <div className="text-xs uppercase text-text-muted">Payouts</div>
        <div className="text-lg font-bold text-text">
          Connect Stripe to enable tipping
        </div>
        <p className="text-sm text-text-muted max-w-xl">
          Earnings are calculated in USD. We keep $3.33 for every $50 you make
          (nothing below $50). Stripe charges a fixed 2.9% processing fee
          separately.
        </p>
        <button
          type="button"
          onClick={onConnectClick}
          className="mt-2 inline-flex items-center justify-center bg-text text-coral text-xs font-semibold uppercase px-6 py-2  hover:bg-coral hover:text-text transition-colors"
        >
          Connect Stripe payouts
        </button>
      </section>
    );
  }

  return (
    <section className="border border-text/20 bg-gold px-6 py-4 flex flex-col gap-1">
      <div className="text-xs uppercase text-text font-bold">Payouts</div>
      <div className="text-md text-">
        Connected to Stripe
        {connection.stripeAccountId && (
          <span className="ml-2 text-xs text-text font-bold">
            ({connection.stripeAccountId.slice(-6)})
          </span>
        )}
      </div>
      <div className="text-xs text-text font-bold">
        Status:{" "}
        {connection.detailsSubmitted
          ? "Ready for payouts"
          : "Verification in progress"}
      </div>
      <div className="text-xs text-text">
        Earnings are calculated in USD. <span className="font-bold text-text">We keep $3.33 per $50 you make—if you
          earn less than $50 for the period, we keep nothing. </span> Stripe’s fixed 2.9%
        processing fee remains separate.
      </div>
    </section>
  );
}
