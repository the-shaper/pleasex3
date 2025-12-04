import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

// Initialize Stripe
// Initialize Stripe with a fallback to prevent build-time errors
const stripe = new Stripe(process.env.STRIPE_API_KEY || "dummy_key_for_build", {
    apiVersion: "2022-11-15",
});

// Initialize Convex Client (for calling mutations)
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const formattedUrl = convexUrl.startsWith("http") ? convexUrl : `https://${convexUrl}`;
const convex = new ConvexHttpClient(formattedUrl);

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }

    try {
        switch (event.type) {
            // V3 Flow: "Authorize Only" -> "Manual Capture"
            // When the user confirms payment in the modal, Stripe creates a PaymentIntent
            // with capture_method: 'manual'.
            //
            // 1. payment_intent.amount_capturable_updated
            //    This event fires when funds are authorized and held.
            //    We should mark the ticket as "open" (visible in dashboard).
            case "payment_intent.amount_capturable_updated": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const ticketRef = paymentIntent.metadata.ticketRef;

                if (ticketRef) {
                    console.log(`💰 Payment authorized for ticket ${ticketRef}`);
                    await convex.mutation(api.tickets.markAsOpen, { ref: ticketRef });
                }
                break;
            }

            // 2. payment_intent.succeeded
            //    This fires when the creator APPROVES the ticket and funds are captured.
            //    We already handle the DB update in the `capturePaymentForTicket` action,
            //    but this webhook is a good safety net or for recording the final transaction.
            //    For now, we rely on the action, but we could add logging here.
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log(`✅ Payment captured for PI: ${paymentIntent.id}`);
                // Logic to record payment in `payments` table is handled by the action
                // that triggered the capture, or we could move it here for robustness.
                // For this task, we focus on the "pending -> open" transition.
                break;
            }

            // 3. payment_intent.payment_failed
            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log(`❌ Payment failed for PI: ${paymentIntent.id}`);
                break;
            }
        }
    } catch (err: any) {
        console.error(`Error processing webhook: ${err.message}`);
        return NextResponse.json(
            { error: "Error processing webhook" },
            { status: 500 }
        );
    }

    return NextResponse.json({ received: true });
}
