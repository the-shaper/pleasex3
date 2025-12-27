import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import Stripe from "stripe";

const http = httpRouter();
const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2022-11-15",
});

http.route({
  path: "/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    const payload = await request.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed", err);
      return new Response("Webhook signature verification failed", {
        status: 400,
      });
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const ticketRef = paymentIntent.metadata.ticketRef;
      const creatorSlug = paymentIntent.metadata.creatorSlug;

      if (ticketRef && creatorSlug) {
        // 1. Record the payment
        await ctx.runMutation(api.payments.recordStripePayment, {
          creatorSlug,
          amountGross: paymentIntent.amount,
          currency: paymentIntent.currency,
          externalId: paymentIntent.id,
          provider: "stripe",
          status: "succeeded",
          ticketRef,
        });

        // 2. Update ticket status to open (or approved if auto-approve logic exists)
        // For now, we mark it as open so it appears in the dashboard
        await ctx.runMutation(api.tickets.markAsOpen, { ref: ticketRef });

        // 3. Update payment intent status on ticket
        await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
          ticketRef,
          paymentIntentId: paymentIntent.id,
          status: "succeeded",
        });
      }
    } else if (event.type === "payment_intent.amount_capturable_updated") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const ticketRef = paymentIntent.metadata.ticketRef;
      const creatorSlug = paymentIntent.metadata.creatorSlug;

      if (ticketRef && creatorSlug) {
        // This event means the funds are held and ready to capture.
        // We should show the ticket in the dashboard now.

        // 1. Update ticket status to open so it appears in ApprovalPanel
        await ctx.runMutation(api.tickets.markAsOpen, { ref: ticketRef });

        // 2. Update payment intent status on ticket
        await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
          ticketRef,
          paymentIntentId: paymentIntent.id,
          status: "requires_capture",
        });
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const creatorSlug = paymentIntent.metadata.creatorSlug;
      const ticketRef = paymentIntent.metadata.ticketRef;

      console.error("[ConvexHTTP] Payment FAILED", {
        id: paymentIntent.id,
        creatorSlug,
        ticketRef,
        status: paymentIntent.status,
        error_code: paymentIntent.last_payment_error?.code,
        error_message: paymentIntent.last_payment_error?.message,
        decline_code: paymentIntent.last_payment_error?.decline_code,
      });

      // Optionally update DB status to failed if needed, but logging is the priority request
      if (ticketRef) {
        // You might want to record this failure if you have a place for it, 
        // but strictly for debugging logs, the console.error is what will show up in the Dashboard.
      }

    } else if (event.type === "account.updated") {
      // Handle Stripe Connect account updates (onboarding completion)
      const account = event.data.object as Stripe.Account;
      console.log("[ConvexHTTP] Account updated:", account.id, {
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
      });

      // Check if onboarding is complete
      if (account.details_submitted && account.payouts_enabled) {
        await ctx.runMutation(api.stripeOnboarding.markOnboardingComplete, {
          stripeAccountId: account.id,
        });
        console.log("[ConvexHTTP] Marked onboarding complete for", account.id);
      }
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
