import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

const stripeApiKey = process.env.STRIPE_API_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Initialize Stripe with a fallback to prevent build-time errors
const stripe = new Stripe(stripeApiKey || "dummy_key_for_build", {
  apiVersion: "2022-11-15",
});

const formattedUrl = convexUrl?.startsWith("http")
  ? convexUrl
  : `https://${convexUrl}`;
const client = new ConvexHttpClient(
  formattedUrl || "https://dummy.convex.cloud"
);

const logPrefix = "[StripeWebhook]";

function log(...args: unknown[]) {
  console.log(logPrefix, ...args);
}

function logWarn(...args: unknown[]) {
  console.warn(logPrefix, ...args);
}

function logError(...args: unknown[]) {
  console.error(logPrefix, ...args);
}

async function getFeeInfoFromCharge(chargeId: string) {
  const charge = (await stripe.charges.retrieve(chargeId, {
    expand: ["balance_transaction"],
  })) as Stripe.Charge;

  let stripeFeeCents = 0;
  let netCents = charge.amount ?? 0;

  const balanceTx = charge.balance_transaction as
    | string
    | Stripe.BalanceTransaction
    | undefined;

  let bt: Stripe.BalanceTransaction | null = null;
  if (balanceTx) {
    if (typeof balanceTx === "string") {
      bt = await stripe.balanceTransactions.retrieve(balanceTx);
    } else {
      bt = balanceTx;
    }
  }

  if (bt) {
    stripeFeeCents = bt.fee ?? 0;
    netCents = bt.net ?? Math.max(0, (charge.amount ?? 0) - stripeFeeCents);
  }

  return {
    amount: charge.amount ?? netCents + stripeFeeCents,
    currency: charge.currency ?? "usd",
    stripeFeeCents,
    netCents,
  };
}

async function getIntentFeeInfo(intentId: string) {
  const pi = await stripe.paymentIntents.retrieve(intentId, {
    expand: ["latest_charge"],
  });
  const chargeId =
    (pi as any).latest_charge || (pi as any).charges?.data?.[0]?.id || null;

  if (!chargeId) {
    return {
      amount: pi.amount ?? 0,
      currency: pi.currency ?? "usd",
      stripeFeeCents: 0,
      netCents: pi.amount ?? 0,
    };
  }

  return getFeeInfoFromCharge(chargeId);
}

export async function POST(req: NextRequest) {
  if (!stripeApiKey) {
    console.error("STRIPE_API_KEY is required for Stripe webhook");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is required for webhook verification");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }
  if (!convexUrl) {
    console.error("NEXT_PUBLIC_CONVEX_URL is required to call Convex");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    log("Event received", event.id, event.type);
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        log("Checkout session completed", {
          id: session.id,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
          metadata: session.metadata,
        });
        if (session.payment_status !== "paid") {
          logWarn(
            "Session not marked as paid, skipping",
            session.id,
            session.payment_status
          );
          break;
        }

        const { creatorSlug, ticketRef } = session.metadata ?? {};
        const paymentIntentId = session.payment_intent
          ? typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent.id
          : undefined;
        if (!creatorSlug || !ticketRef || !paymentIntentId) {
          logWarn("Missing metadata, skipping payment record", {
            sessionId: session.id,
            metadata: session.metadata,
            paymentIntentId,
          });
          break;
        }

        try {
          const { amount, currency, stripeFeeCents, netCents } =
            await getIntentFeeInfo(paymentIntentId);

          await client.mutation(api.payments.recordStripePayment, {
            creatorSlug,
            amountGross: amount ?? session.amount_total ?? 0,
            currency: currency ?? session.currency ?? "usd",
            externalId: paymentIntentId,
            provider: "stripe",
            status: "succeeded",
            ticketRef,
            createdAt: Date.now(),
            stripeFeeCents,
            netCents,
          });
          log("Recorded payment", {
            creatorSlug,
            ticketRef,
            amount,
            currency,
          });
        } catch (mutationError) {
          logError("Failed to record payment in Convex", mutationError);
          throw mutationError;
        }
        break;
      }
      // Add more event types as needed, e.g., "payment_intent.succeeded"
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        if (intent.status === "succeeded") {
          log("Payment intent succeeded", intent.id);
          const { creatorSlug, ticketRef } = intent.metadata ?? {};
          if (!creatorSlug || !ticketRef) {
            logWarn("Missing metadata on intent, skipping payment record", {
              intentId: intent.id,
              metadata: intent.metadata,
            });
            break;
          }

          const { amount, currency, stripeFeeCents, netCents } =
            await getIntentFeeInfo(intent.id);

          await client.mutation(api.payments.recordStripePayment, {
            creatorSlug,
            amountGross: amount ?? intent.amount ?? 0,
            currency: currency ?? intent.currency ?? "usd",
            externalId: intent.id,
            provider: "stripe",
            status: "succeeded",
            ticketRef,
            createdAt: Date.now(),
            stripeFeeCents,
            netCents,
          });
        }
        break;
      }

      case "charge.updated": {
        const charge = event.data.object as Stripe.Charge;
        if (!charge.id) break;
        const balanceTx = charge.balance_transaction;
        const hasBalanceTx = !!balanceTx;

        if (!hasBalanceTx) {
          logWarn("charge.updated without balance_transaction", charge.id);
          break;
        }

        // Try to find creatorSlug/ticketRef from metadata if present
        const creatorSlug = (charge.metadata as any)?.creatorSlug;
        const ticketRef = (charge.metadata as any)?.ticketRef;

        const { amount, currency, stripeFeeCents, netCents } =
          await getFeeInfoFromCharge(charge.id);

        // If we don't have metadata, we still try to patch by externalId = charge.payment_intent
        const externalId =
          (charge.payment_intent as string | null) || charge.id || "";
        if (!externalId) break;

        await client.mutation(api.payments.recordStripePayment, {
          creatorSlug: creatorSlug ?? "",
          amountGross: amount ?? charge.amount ?? 0,
          currency: currency ?? charge.currency ?? "usd",
          externalId,
          provider: "stripe",
          status: "succeeded",
          ticketRef: ticketRef ?? undefined,
          createdAt: Date.now(),
          stripeFeeCents,
          netCents,
        });
        log("Patched payment from charge.updated", {
          chargeId: charge.id,
          externalId,
          stripeFeeCents,
          netCents,
        });
        break;
      }

      // Handle Stripe Connect account updates (onboarding completion)
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        log("Account updated", {
          id: account.id,
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
        });

        // Check if onboarding is complete (details submitted and payouts enabled)
        if (account.details_submitted && account.payouts_enabled) {
          try {
            await client.mutation(api.stripeOnboarding.markOnboardingComplete, {
              stripeAccountId: account.id,
            });
            log("Marked onboarding complete for account", account.id);
          } catch (mutationError) {
            logError(
              "Failed to mark onboarding complete in Convex",
              mutationError
            );
          }
        }
        break;
      }

      default:
        log("Unhandled event type", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    logError("Webhook handler error", err);
    // Still return 200 to acknowledge receipt, per Stripe best practices
    return NextResponse.json({ received: true });
  }
}
