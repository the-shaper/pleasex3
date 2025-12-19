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
  // State 1: Onboarding started but not complete - show "in progress" UI
  if (connection.onboardingStarted) {
    return (
      <section className="border border-text/20 bg-bg px-6 py-4 flex flex-col gap-2">
        <div className="text-md font-bold uppercase text-text-muted">Payouts</div>
        <div className="text-lg font-bold text-text">
          Stripe onboarding in progress
        </div>
        <p className="text-sm text-text-muted max-w-xl">
          Complete your Stripe account setup to start receiving payouts. If you
          closed the Stripe window, click the button below to continue.
        </p>
        <button
          type="button"
          onClick={onConnectClick}
          className="mt-2 inline-flex items-center justify-center bg-text text-coral text-xs font-semibold uppercase px-6 py-2 hover:bg-coral hover:text-text transition-colors"
        >
          Continue Stripe setup
        </button>
      </section>
    );
  }

  // State 2: Not connected at all - show "connect" UI
  if (!connection.connected) {
    return (
      <section className="border border-text/20 bg-bg px-6 py-4 flex flex-col gap-2">
        <div className="text-md font-bold uppercase text-text-muted">Payouts</div>
        <div className="text-lg font-bold text-text">
          Connect Stripe to enable tipping
        </div>
        <p className="text-sm text-text-muted max-w-xl">
          Earnings are calculated in USD.
        </p>
        <p className="text-sm text-text-muted max-w-xl">
          We keep $3.33 for every $50 THRESHOLD you make (nothing below
          $50).{" "}
        </p>
        <p className="text-sm text-text-muted max-w-xl">
          Stripe charges a fixed 2.9% processing fee separately.
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

  // State 3: Fully connected - show success UI
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
        Earnings are calculated in USD.{" "}
        <span className="font-bold text-text">
          We keep $3.33 per $50 THRESHOLD you make—if you earn less than $50 for
          the period, we keep nothing.{" "}
        </span>{" "}
        <p className="text-xs text-text max-w-xl">
          Stripe's fixed 2.9% + $0.30 per card transaction (varies by
          country/payment method) processing fee remains separate.
        </p>
      </div>
    </section>
  );
}
