import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/server";
import { api } from "@convex/_generated/api";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeApiKey = process.env.STRIPE_API_KEY;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!stripeApiKey || !webhookSecret || !convexUrl) {
  throw new Error(
    "Stripe webhook route requires STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, and NEXT_PUBLIC_CONVEX_URL"
  );
}

const stripe = new Stripe(stripeApiKey, { apiVersion: "2024-08-23" });
const convexClient = new ConvexHttpClient(convexUrl);

const recordPayment = async (
  creatorSlug: string | undefined,
  amountGross: number | null | undefined,
  currency: string | undefined,
  externalId: string,
  metadata?: Stripe.Metadata
) => {
  if (!creatorSlug || amountGross == null || !currency) {
    return;
  }

  await convexClient.mutation(api.payments.recordStripePayment, {
    creatorSlug,
    amountGross,
    currency,
    externalId,
    provider: "stripe",
    status: "succeeded",
    ticketRef: metadata?.ticketRef,
    createdAt: Date.now(),
  });
};

const handleCheckoutSession = async (session: Stripe.Checkout.Session) => {
  const creatorSlug = session.metadata?.creatorSlug;
  const currency =
    session.currency ?? session.customer_details?.currency ?? "usd";
  const amountGross = session.amount_total ?? session.amount_subtotal ?? 0;
  const externalId =
    (session.payment_intent as string | undefined) ?? session.id;

  if (!externalId) return;

  await recordPayment(
    creatorSlug,
    amountGross,
    currency,
    externalId,
    session.metadata
  );
};

const handlePaymentIntent = async (intent: Stripe.PaymentIntent) => {
  const creatorSlug = intent.metadata?.creatorSlug;
  const currency = intent.currency ?? "usd";
  const amountGross = intent.amount_received ?? intent.amount ?? 0;

  await recordPayment(
    creatorSlug,
    amountGross,
    currency,
    intent.id,
    intent.metadata
  );
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature mismatch", error);
    return NextResponse.json(
      { ok: false, error: "Signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSession(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntent(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        // ignore other events for now
        break;
    }
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return NextResponse.json(
      { ok: false, error: "Processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
