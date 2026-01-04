import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { api } from "./_generated/api";

const MONTHLY_THRESHOLD_CENTS = 5000;
const PLATFORM_FEE_PER_BLOCK_CENTS = 333;

function getMonthRangeUtc(year: number, month: number) {
  const start = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const end = Date.UTC(year, month, 1, 0, 0, 0, 0);
  return { periodStart: start, periodEnd: end };
}

function computePlatformFee(grossCents: number) {
  if (grossCents < MONTHLY_THRESHOLD_CENTS) {
    return {
      platformFeeCents: 0,
      payoutCents: grossCents,
      thresholdReached: false,
    };
  }
  const blocks = Math.floor(grossCents / MONTHLY_THRESHOLD_CENTS);
  const platformFeeCents = blocks * PLATFORM_FEE_PER_BLOCK_CENTS;
  return {
    platformFeeCents,
    payoutCents: grossCents - platformFeeCents,
    thresholdReached: true,
  };
}

async function getGrossForCreator(
  ctx: any,
  creatorSlug: string,
  periodStart: number,
  periodEnd: number
) {
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_creator_createdAt", (q: any) =>
      q
        .eq("creatorSlug", creatorSlug)
        .gte("createdAt", periodStart)
        .lt("createdAt", periodEnd)
    )
    .collect();
  return payments.reduce(
    (acc: { gross: number; stripeFee: number }, payment: any) => {
      acc.gross += payment.amountGross;
      acc.stripeFee += payment.stripeFeeCents ?? 0;
      return acc;
    },
    { gross: 0, stripeFee: 0 }
  );
}

export const recordStripePayment = mutation({
  args: {
    creatorSlug: v.string(),
    amountGross: v.number(),
    currency: v.string(),
    externalId: v.string(),
    provider: v.string(),
    status: v.string(),
    ticketRef: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    stripeFeeCents: v.optional(v.number()),
    netCents: v.optional(v.number()),
    exchangeRate: v.optional(v.number()),
    originalAmountCents: v.optional(v.number()),
    localCurrency: v.optional(v.string()),
    localAmountGross: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log("[Convex][recordStripePayment] incoming", {
      externalId: args.externalId,
      creatorSlug: args.creatorSlug,
      amount: args.amountGross,
      currency: args.currency,
      stripeFeeCents: args.stripeFeeCents,
      netCents: args.netCents,
    });
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (existing) {
      console.log(
        "[Convex][recordStripePayment] exists, patching fees if provided",
        args.externalId
      );

      const stripeFeeCents =
        args.stripeFeeCents ?? existing.stripeFeeCents ?? 0;
      const netCents =
        args.netCents ??
        existing.netCents ??
        Math.max(0, existing.amountGross - stripeFeeCents);

      await ctx.db.patch(existing._id, {
        stripeFeeCents,
        netCents,
        // Update normalization fields if provided (e.g. on capture)
        amountGross: args.amountGross,
        currency: args.currency,
        localCurrency: args.localCurrency ?? existing.localCurrency,
        localAmountGross: args.localAmountGross ?? existing.localAmountGross,
      });

      return { ok: true, paymentId: existing._id as string };
    }

    const createdAt = args.createdAt ?? Date.now();
    const stripeFeeCents = args.stripeFeeCents ?? 0;
    const netCents =
      args.netCents ?? Math.max(0, args.amountGross - stripeFeeCents);
    const insertedId = await ctx.db.insert("payments", {
      creatorSlug: args.creatorSlug,
      amountGross: args.amountGross,
      currency: args.currency,
      status: args.status,
      provider: args.provider,
      externalId: args.externalId,
      createdAt,
      ticketRef: args.ticketRef,
      stripeFeeCents,
      netCents,
      exchangeRate: args.exchangeRate,
      originalAmountCents: args.originalAmountCents,
      localCurrency: args.localCurrency,
      localAmountGross: args.localAmountGross,
    });

    console.log("[Convex][recordStripePayment] inserted", insertedId);
    return { ok: true, paymentId: insertedId as string };
  },
});

// --- Helpers for Payout Action ---

export const getGrossForCreatorQuery = query({
  args: {
    creatorSlug: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    return getGrossForCreator(
      ctx,
      args.creatorSlug,
      args.periodStart,
      args.periodEnd
    );
  },
});

export const getPayoutByCreatorPeriod = query({
  args: {
    creatorSlug: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payouts")
      .withIndex("by_creator_period", (q) =>
        q
          .eq("creatorSlug", args.creatorSlug)
          .eq("periodStart", args.periodStart)
          .eq("periodEnd", args.periodEnd)
      )
      .unique();
  },
});

export const getPaymentByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
  },
});

export const upsertPayoutRecord = mutation({
  args: {
    creatorSlug: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    grossCents: v.number(),
    platformFeeCents: v.number(),
    payoutCents: v.number(),
    stripeTransferId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("paid"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payouts")
      .withIndex("by_creator_period", (q) =>
        q
          .eq("creatorSlug", args.creatorSlug)
          .eq("periodStart", args.periodStart)
          .eq("periodEnd", args.periodEnd)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        grossCents: args.grossCents,
        platformFeeCents: args.platformFeeCents,
        payoutCents: args.payoutCents,
        stripeTransferId: args.stripeTransferId,
        status: args.status,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("payouts", {
        creatorSlug: args.creatorSlug,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        grossCents: args.grossCents,
        platformFeeCents: args.platformFeeCents,
        payoutCents: args.payoutCents,
        currency: "usd",
        stripeTransferId: args.stripeTransferId,
        status: args.status,
        createdAt: Date.now(),
      });
    }
  },
});

export const updatePaymentFees = mutation({
  args: {
    paymentId: v.id("payments"),
    stripeFeeCents: v.number(),
    netCents: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      stripeFeeCents: args.stripeFeeCents,
      netCents: args.netCents,
    });
  },
});

export const scheduleMonthlyPayouts = action({
  args: {
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, { year, month }) => {
    const { periodStart, periodEnd } = getMonthRangeUtc(year, month);

    // 1. Get all creators
    const creators = await ctx.runQuery(api.dashboard.getAllCreators);

    let processed = 0;
    let transfers = 0;

    for (const creator of creators) {
      if (!creator.stripeAccountId) continue;

      // 2. Calculate Gross
      // We need a query to get gross for creator. We can't use ctx.db in action.
      // We'll use a helper query exposed via api.
      const { gross: grossCents, stripeFee: stripeFeeCents } =
        await ctx.runQuery(api.payments.getGrossForCreatorQuery, {
          creatorSlug: creator.slug,
          periodStart,
          periodEnd,
        });

      if (grossCents === 0) continue;

      // 3. Calculate Fees
      const { platformFeeCents } = computePlatformFee(grossCents);
      const payoutCents = Math.max(
        0,
        grossCents - platformFeeCents - stripeFeeCents
      );

      // 4. Check if payout already exists
      const existing = await ctx.runQuery(
        api.payments.getPayoutByCreatorPeriod,
        {
          creatorSlug: creator.slug,
          periodStart,
          periodEnd,
        }
      );

      if (existing && existing.status === "paid") {
        console.log(`Payout already paid for ${creator.slug}`);
        continue;
      }

      // 5. Perform Transfer (if not already done)
      let stripeTransferId = existing?.stripeTransferId;

      if (!stripeTransferId && payoutCents > 0) {
        try {
          const transfer = await stripe.transfers.create(
            {
              amount: payoutCents,
              currency: "usd",
              destination: creator.stripeAccountId,
              metadata: {
                creatorSlug: creator.slug,
                period: `${year}-${month}`,
                type: "monthly_payout",
              },
            },
            {
              idempotencyKey: `payout-${creator.slug}-${year}-${month}`,
            }
          );
          stripeTransferId = transfer.id;
          transfers++;
        } catch (err) {
          console.error(`Transfer failed for ${creator.slug}`, err);
          // We continue to record the attempt, status will be failed/pending
        }
      }

      // 6. Record/Update Payout Record
      await ctx.runMutation(api.payments.upsertPayoutRecord, {
        creatorSlug: creator.slug,
        periodStart,
        periodEnd,
        grossCents,
        platformFeeCents,
        payoutCents,
        stripeTransferId,
        status: stripeTransferId ? "paid" : "failed",
      });

      processed++;
    }

    return { ok: true, processed, transfers };
  },
});

const stripeApiKey = process.env.STRIPE_API_KEY;
if (!stripeApiKey) {
  throw new Error("STRIPE_API_KEY is required for Stripe onboarding");
}

const stripe = new Stripe(stripeApiKey, { apiVersion: "2022-11-15" });

async function getStripeFeeInfoFromCharge(chargeRef: string | Stripe.Charge) {
  const chargeId =
    typeof chargeRef === "string" ? chargeRef : (chargeRef as Stripe.Charge).id;

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
    const feeRaw = bt.fee ?? 0;
    const netRaw = bt.net ?? Math.max(0, (charge.amount ?? 0) - feeRaw);

    if (
      bt.currency &&
      charge.currency &&
      bt.currency !== charge.currency &&
      bt.exchange_rate
    ) {
      // Normalize BT amounts to the charge currency using Stripe-provided rate
      stripeFeeCents = Math.round(feeRaw / bt.exchange_rate);
      netCents = Math.round(netRaw / bt.exchange_rate);
    } else {
      stripeFeeCents = feeRaw;
      netCents = netRaw;
      if (bt.currency && charge.currency && bt.currency !== charge.currency) {
        console.warn(
          "[Convex][Fees] Currency mismatch without exchange_rate",
          chargeId,
          { btCurrency: bt.currency, chargeCurrency: charge.currency }
        );
      }
    }
  }

  return {
    stripeFeeCents,
    netCents,
    currency: charge.currency,
    amount: charge.amount,
  };
}

async function getStripeFeeInfo(paymentIntentId: string) {
  const pi = (await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  })) as Stripe.PaymentIntent;

  const rawCharge =
    (pi as any).latest_charge ?? (pi as any).charges?.data?.[0] ?? null;
  const chargeId =
    typeof rawCharge === "string"
      ? rawCharge
      : ((rawCharge as Stripe.Charge | undefined)?.id ?? null);

  if (!chargeId) {
    console.warn(
      "[Convex][Fees] No charge found on payment intent",
      paymentIntentId
    );
    return {
      stripeFeeCents: 0,
      netCents: pi.amount ?? 0,
      currency: pi.currency,
      amount: pi.amount,
    };
  }

  return getStripeFeeInfoFromCharge(chargeId);
}

// V3.1: Manual Payment Intent - DYNAMIC LOCAL CURRENCY
// Charges in user's local currency using real-time Stripe Exchange Rates.
// Funds settle on Platform Account (converted to Platform currency if needed).
export const createManualPaymentIntent = action({
  args: {
    creatorSlug: v.string(),
    ticketRef: v.string(),
    amountCents: v.number(), // Input is always USD
    currency: v.optional(v.string()), // Target currency (e.g. "mxn")
  },
  handler: async (ctx, args) => {
    if (args.amountCents <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const creator = await ctx.runQuery(api.dashboard.getCreator, {
      creatorSlug: args.creatorSlug,
    });

    if (!creator || !creator.stripeAccountId) {
      throw new Error("Creator does not have a connected Stripe account");
    }

    // Default to USD
    let chargeCurrency = "usd";
    let chargeAmountCents = args.amountCents;
    let exchangeRate = 1;

    // If target currency is provided and not USD, fetch real-time rate
    if (args.currency && args.currency.toLowerCase() !== "usd") {
      try {
        const targetCurrency = args.currency.toLowerCase();

        // Use a public, reliable Exchange Rate API instead of restricted Stripe endpoint
        // This solves the 404 "Unrecognized request URL" error
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        if (!response.ok) {
          throw new Error(`Exchange rate API failed: ${response.statusText}`);
        }

        const data = await response.json();
        const rate = data.rates[targetCurrency.toUpperCase()]; // API uses uppercase keys

        if (rate) {
          chargeCurrency = targetCurrency;
          exchangeRate = rate;
          // Calculate local amount: USD * Rate
          chargeAmountCents = Math.round(args.amountCents * rate);

          console.log(`[Payment] Converting ${args.amountCents} USD to ${chargeCurrency} at rate ${rate} = ${chargeAmountCents}`);
        } else {
          console.warn(`[Payment] Exchange rate not found for ${targetCurrency}, falling back to USD`);
        }
      } catch (err) {
        console.error("[Payment] Failed to fetch exchange rates:", err);
        // Fallback to USD on error
      }
    }

    // Create PaymentIntent in the determined currency
    try {
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: chargeAmountCents,
        currency: chargeCurrency,
        capture_method: "manual",
        automatic_payment_methods: { enabled: true },
        metadata: {
          creatorSlug: args.creatorSlug,
          ticketRef: args.ticketRef,
          originalUsdCents: String(args.amountCents),
          exchangeRate: String(exchangeRate),
          chargeCurrency,
        },
      };

      console.log("[Payment] Creating Stripe PaymentIntent with params:", JSON.stringify(paymentIntentParams, null, 2));

      // Funds held on Platform Account (`on_behalf_of` is NOT used here to preserve "Hold" logic)
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      // Store transaction details immediately in payments table
      await ctx.runMutation(api.payments.createPendingPayment, {
        creatorSlug: args.creatorSlug,
        ticketRef: args.ticketRef,
        amountGross: chargeAmountCents,
        currency: chargeCurrency,
        externalId: paymentIntent.id,
        originalAmountCents: args.amountCents,
        exchangeRate: exchangeRate,
      });

      // Store the paymentIntentId on the ticket
      await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
        ticketRef: args.ticketRef,
        paymentIntentId: paymentIntent.id,
        status: "pending",
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        chargeAmountCents,
        chargeCurrency,
        exchangeRate,
      };

    } catch (error: any) {
      console.error("[Payment] Create PaymentIntent failed:", error);
      throw new Error(`Payment setup failed: ${error.message}`);
    }
  },
});

export const createPendingPayment = mutation({
  args: {
    creatorSlug: v.string(),
    ticketRef: v.string(),
    amountGross: v.number(),
    currency: v.string(),
    externalId: v.string(),
    originalAmountCents: v.optional(v.number()),
    exchangeRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("payments", {
      creatorSlug: args.creatorSlug,
      ticketRef: args.ticketRef,
      amountGross: args.amountGross,
      currency: args.currency,
      status: "pending",
      provider: "stripe",
      externalId: args.externalId,
      createdAt: Date.now(),
      originalAmountCents: args.originalAmountCents,
      exchangeRate: args.exchangeRate,
    });
  },
});

// V3: Manual Checkout Session (Redirect-based Hold)
export const createManualCheckoutSession = action({
  args: {
    creatorSlug: v.string(),
    ticketRef: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amountCents <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const creator = await ctx.runQuery(api.dashboard.getCreator, {
      creatorSlug: args.creatorSlug,
    });

    if (!creator || !creator.stripeAccountId) {
      throw new Error("Creator does not have a connected Stripe account");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: args.currency ?? "usd",
            product_data: {
              name: `Tipping ${creator.displayName} for a favor`,
            },
            unit_amount: args.amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        capture_method: "manual", // <--- THE KEY DIFFERENCE
        metadata: {
          creatorSlug: args.creatorSlug,
          ticketRef: args.ticketRef,
        },
      },
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        creatorSlug: args.creatorSlug,
        ticketRef: args.ticketRef,
      },
    });

    // Store the PaymentIntent ID on the ticket IMMEDIATELY (if available)
    // Note: For "payment" mode, session.payment_intent is populated on creation.
    if (session.payment_intent) {
      const piId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent.id;

      await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
        ticketRef: args.ticketRef,
        paymentIntentId: piId,
        status: "pending", // It will be authorized once the user completes checkout
      });
    }

    return {
      url: session.url,
      id: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
    };
  },
});

export const setPaymentIntentForTicket = mutation({
  args: {
    ticketRef: v.string(),
    paymentIntentId: v.string(),
    status: v.union(
      v.literal("requires_capture"),
      v.literal("succeeded"),
      v.literal("canceled"),
      v.literal("refunded"),
      v.literal("pending")
    ),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ticketRef))
      .unique();

    if (!ticket) return;

    await ctx.db.patch(ticket._id, {
      paymentIntentId: args.paymentIntentId,
      paymentStatus: args.status,
    });
  },
});

// V3: Capture funds (Creator approves)
export const capturePaymentForTicket = action({
  args: {
    ticketRef: v.string(),
  },
  handler: async (ctx, args): Promise<{ ok: boolean; status: string }> => {
    const ticket = await ctx.runQuery(api.tickets.getByRef, {
      ref: args.ticketRef,
    });
    if (!ticket) throw new Error("Ticket not found");
    if (!ticket.paymentIntentId) {
      // No payment attached (e.g. free ticket or legacy)
      await ctx.runMutation(api.tickets.approve, { ref: args.ticketRef });
      return { ok: true, status: "no_payment" };
    }

    try {
      const paymentIntent = await stripe.paymentIntents.capture(
        ticket.paymentIntentId,
        { expand: ["latest_charge"] }
      );

      if (paymentIntent.status === "succeeded") {
        const { stripeFeeCents, netCents, amount, currency } =
          await getStripeFeeInfo(ticket.paymentIntentId);

        // Normalize currency to USD if needed
        let finalAmountGross = amount ?? paymentIntent.amount;
        let finalStripeFeeCents = stripeFeeCents;
        let finalNetCents = netCents;
        let finalCurrency = currency ?? paymentIntent.currency;
        let localCurrency = null;
        let localAmountGross = null;

        // If local currency was used, we normalize to USD for the dashboard
        if (finalCurrency.toLowerCase() !== "usd") {
          const grossUsdCents = ticket.tipCents; // This is the original USD amount from ticket creation

          if (grossUsdCents > 0) {
            // Calculate effective rate: LocalAmount / UsdAmount
            // e.g. 1791 / 100 = 17.91
            const effectiveRate = finalAmountGross / grossUsdCents;

            // Normalize Fee to USD: LocalFee / Rate
            // e.g. 422 / 17.91 = ~23.5 cents USD
            const feeUsdCents = Math.round(finalStripeFeeCents / effectiveRate);

            console.log(`[Capture] Normalizing Fees to USD:`, {
              localGross: finalAmountGross,
              localFee: finalStripeFeeCents,
              usdGross: grossUsdCents,
              effectiveRate,
              usdFee: feeUsdCents
            });

            // Set normalized values for storage
            finalCurrency = "usd";
            finalAmountGross = grossUsdCents;
            finalStripeFeeCents = feeUsdCents;
            finalNetCents = Math.max(0, grossUsdCents - feeUsdCents);

            // Store original values for reference
            localCurrency = currency ?? paymentIntent.currency;
            localAmountGross = amount ?? paymentIntent.amount;
          }
        }

        // Record in payments table
        await ctx.runMutation(api.payments.recordStripePayment, {
          creatorSlug: ticket.creatorSlug,
          amountGross: finalAmountGross,
          currency: finalCurrency,
          externalId: paymentIntent.id,
          provider: "stripe",
          status: "succeeded",
          ticketRef: ticket.ref,
          stripeFeeCents: finalStripeFeeCents,
          netCents: finalNetCents,
          localCurrency: localCurrency ?? undefined,
          localAmountGross: localAmountGross ?? undefined,
        });

        // Update ticket status
        await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
          ticketRef: args.ticketRef,
          paymentIntentId: ticket.paymentIntentId,
          status: "succeeded",
        });

        // Mark ticket as approved in the main table
        await ctx.runMutation(api.tickets.approve, { ref: args.ticketRef });

        return { ok: true, status: "succeeded" };
      } else {
        return { ok: false, status: paymentIntent.status };
      }
    } catch (err: any) {
      console.error("Capture failed:", err);

      // Check for "already captured" error to make this idempotent
      const isAlreadyCaptured =
        err.code === "payment_intent_unexpected_state" ||
        err.raw?.code === "payment_intent_unexpected_state" ||
        err.message?.includes("already been captured");

      if (isAlreadyCaptured) {
        console.log("PaymentIntent was already captured. Verifying status...");
        const pi = await stripe.paymentIntents.retrieve(
          ticket.paymentIntentId,
          {
            expand: ["latest_charge"],
          }
        );
        if (pi.status === "succeeded") {
          const { stripeFeeCents, netCents, amount, currency } =
            await getStripeFeeInfo(ticket.paymentIntentId);

          // Normalize currency to USD if needed (Duplicate logic for idempotency path)
          let finalAmountGross = amount ?? pi.amount;
          let finalStripeFeeCents = stripeFeeCents;
          let finalNetCents = netCents;
          let finalCurrency = currency ?? pi.currency;
          let localCurrency = null;
          let localAmountGross = null;

          if (finalCurrency.toLowerCase() !== "usd") {
            const grossUsdCents = ticket.tipCents;
            if (grossUsdCents > 0) {
              const effectiveRate = finalAmountGross / grossUsdCents;
              const feeUsdCents = Math.round(finalStripeFeeCents / effectiveRate);

              finalCurrency = "usd";
              finalAmountGross = grossUsdCents;
              finalStripeFeeCents = feeUsdCents;
              finalNetCents = Math.max(0, grossUsdCents - feeUsdCents);

              localCurrency = currency ?? pi.currency;
              localAmountGross = amount ?? pi.amount;
            }
          }

          // Ensure DB is in sync
          await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
            ticketRef: args.ticketRef,
            paymentIntentId: ticket.paymentIntentId,
            status: "succeeded",
          });

          await ctx.runMutation(api.payments.recordStripePayment, {
            creatorSlug: ticket.creatorSlug,
            amountGross: finalAmountGross,
            currency: finalCurrency,
            externalId: pi.id,
            provider: "stripe",
            status: "succeeded",
            ticketRef: ticket.ref,
            stripeFeeCents: finalStripeFeeCents,
            netCents: finalNetCents,
            localCurrency: localCurrency ?? undefined,
            localAmountGross: localAmountGross ?? undefined,
          });

          // Mark ticket as approved in the main table
          await ctx.runMutation(api.tickets.approve, { ref: args.ticketRef });

          return { ok: true, status: "succeeded" };
        }
      }
      throw err;
    }
  },
});

// V3: Cancel/Refund funds (Creator rejects)
export const cancelOrRefundPaymentForTicket = action({
  args: {
    ticketRef: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ ok: boolean; status?: string; action?: string }> => {
    const ticket = await ctx.runQuery(api.tickets.getByRef, {
      ref: args.ticketRef,
    });
    if (!ticket) throw new Error("Ticket not found");
    if (!ticket.paymentIntentId) {
      await ctx.runMutation(api.tickets.reject, { ref: args.ticketRef });
      return { ok: true, status: "no_payment" };
    }

    try {
      const pi = await stripe.paymentIntents.retrieve(ticket.paymentIntentId);

      if (pi.status === "requires_capture") {
        // Authorization only -> Cancel
        await stripe.paymentIntents.cancel(ticket.paymentIntentId);
        await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
          ticketRef: args.ticketRef,
          paymentIntentId: ticket.paymentIntentId,
          status: "canceled",
        });

        // Mark ticket as rejected in the main table
        await ctx.runMutation(api.tickets.reject, { ref: args.ticketRef });

        return { ok: true, action: "canceled" };
      } else if (pi.status === "succeeded") {
        // Already captured -> Refund
        await stripe.refunds.create({ payment_intent: ticket.paymentIntentId });
        // Update payments table record if it exists
        // (We'll rely on the webhook to mark the payment row as refunded, but we can update the ticket here)
        await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
          ticketRef: args.ticketRef,
          paymentIntentId: ticket.paymentIntentId,
          status: "refunded",
        });

        // Mark ticket as rejected in the main table
        await ctx.runMutation(api.tickets.reject, { ref: args.ticketRef });

        return { ok: true, action: "refunded" };
      } else if (pi.status === "canceled") {
        // Already canceled - ensure DB is in sync
        await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
          ticketRef: args.ticketRef,
          paymentIntentId: ticket.paymentIntentId,
          status: "canceled",
        });
        await ctx.runMutation(api.tickets.reject, { ref: args.ticketRef });
        return { ok: true, action: "canceled" };
      } else {
        return { ok: true, status: pi.status };
      }
    } catch (err) {
      console.error("Cancel/Refund failed:", err);
      throw err;
    }
  },
});

// Utility: backfill stripe fees for a single PaymentIntent/externalId
export const backfillStripeFees = action({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    const payment = await ctx.runQuery(api.payments.getPaymentByExternalId, {
      externalId: args.externalId,
    });
    if (!payment) {
      return { ok: false, reason: "not_found" as const };
    }

    const { stripeFeeCents, netCents, amount, currency } =
      await getStripeFeeInfo(args.externalId);

    await ctx.runMutation(api.payments.updatePaymentFees, {
      paymentId: payment._id,
      stripeFeeCents,
      netCents,
    });

    // If amounts were missing, ensure they are patched too
    if (
      payment.amountGross !== (amount ?? payment.amountGross) ||
      payment.currency !== (currency ?? payment.currency)
    ) {
      await ctx.runMutation(api.payments.recordStripePayment, {
        creatorSlug: payment.creatorSlug,
        amountGross: amount ?? payment.amountGross,
        currency: currency ?? payment.currency,
        externalId: payment.externalId,
        provider: payment.provider,
        status: payment.status,
        ticketRef: payment.ticketRef,
        createdAt: payment.createdAt,
        stripeFeeCents,
        netCents,
      });
    }

    return { ok: true };
  },
});

// Legacy or Simple Checkout (Immediate Capture)
export const createCheckoutSession = action({
  args: {
    creatorSlug: v.string(),
    ticketRef: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amountCents <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const creator = await ctx.runQuery(api.dashboard.getCreator, {
      creatorSlug: args.creatorSlug,
    });

    if (!creator || !creator.stripeAccountId) {
      throw new Error("Creator does not have a connected Stripe account");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: args.currency ?? "usd",
            product_data: {
              name: `Tipping ${creator.displayName} for a favor`,
            },
            unit_amount: args.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        creatorSlug: args.creatorSlug,
        ticketRef: args.ticketRef,
      },
    });

    return {
      url: session.url,
      id: session.id,
    };
  },
});

export const finalizeTicketSubmission = action({
  args: { ticketRef: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; status?: string }> => {
    // 1. Get ticket
    const ticket = await ctx.runQuery(api.tickets.getByRef, {
      ref: args.ticketRef,
    });
    if (!ticket) throw new Error("Ticket not found");
    if (!ticket.paymentIntentId) throw new Error("No payment intent found");

    // 2. Retrieve PI from Stripe
    const pi = await stripe.paymentIntents.retrieve(ticket.paymentIntentId);

    // 3. Verify status
    if (pi.status === "requires_capture") {
      // 4. Confirm authorization in DB and send emails
      await ctx.runMutation(api.tickets.confirmTicketAuthorized, {
        ref: args.ticketRef,
      });
      return { ok: true };
    } else {
      console.error("PaymentIntent not authorized", pi.status);
      return { ok: false, status: pi.status };
    }
  },
});
