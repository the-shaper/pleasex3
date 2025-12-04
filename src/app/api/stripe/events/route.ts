import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

const stripeApiKey = process.env.STRIPE_API_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!stripeApiKey) {
  throw new Error("STRIPE_API_KEY is required for Stripe webhook");
}
if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is required for webhook verification");
}
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required to call Convex");
}

const stripe = new Stripe(stripeApiKey, { apiVersion: "2022-11-15" });
const formattedUrl = convexUrl.startsWith("http") ? convexUrl : `https://${convexUrl}`;
const client = new ConvexHttpClient(formattedUrl);
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

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
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
        if (!creatorSlug || !ticketRef) {
          logWarn("Missing metadata, skipping payment record", {
            sessionId: session.id,
            metadata: session.metadata,
          });
          break;
        }

        try {
          await client.mutation(api.payments.recordStripePayment, {
            creatorSlug,
            amountGross: session.amount_total ?? 0,
            currency: session.currency ?? "usd",
            externalId: session.id ?? "",
            provider: "stripe",
            status: "succeeded",
            ticketRef,
            createdAt: Date.now(),
          });
          log("Recorded payment", {
            creatorSlug,
            ticketRef,
            amount: session.amount_total,
            currency: session.currency,
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
          // Similar extraction from intent if needed
          log("Payment intent succeeded", intent.id);
        }
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
