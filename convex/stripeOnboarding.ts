import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import Stripe from "stripe";
import type { Doc } from "./_generated/dataModel";

const stripeApiKey = process.env.STRIPE_API_KEY;
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

if (!stripeApiKey) {
  throw new Error("STRIPE_API_KEY is required for Stripe onboarding");
}

const stripe = new Stripe(stripeApiKey, { apiVersion: "2022-11-15" });

type CreatorDoc = Doc<"creators">;

type StripeAccountLinkResponse = {
  url: string;
  expiresAt: number;
  stripeAccountId: string;
};

function buildAccountLinkUrls(slug: string) {
  const normalized = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const earningsUrl = `${normalized}/${slug}/dashboard?tab=earnings`;
  return {
    refreshUrl: earningsUrl,
    returnUrl: earningsUrl,
  };
}

// Internal query to get creator by slug (exported for api call)
export const getCreatorBySlug = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, { creatorSlug }) => {
    return await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", creatorSlug))
      .unique();
  },
});

// New mutation to upsert Stripe account ID for creator (exported for api call)
export const upsertStripeAccountId = mutation({
  args: {
    creatorId: v.id("creators"),
    stripeAccountId: v.string(),
  },
  handler: async (ctx, { creatorId, stripeAccountId }) => {
    // Verify creator exists
    const creator = await ctx.db.get(creatorId);
    if (!creator) {
      throw new Error("Creator not found");
    }
    // Patch with Stripe ID and disable payouts until verified
    await ctx.db.patch(creatorId, {
      stripeAccountId,
      payoutEnabled: false,
    });
    return { success: true };
  },
});

// Mutation to mark onboarding complete when Stripe confirms via webhook
export const markOnboardingComplete = mutation({
  args: {
    stripeAccountId: v.string(),
  },
  handler: async (ctx, { stripeAccountId }) => {
    // Find creator by Stripe account ID
    const creator = await ctx.db
      .query("creators")
      .filter((q) => q.eq(q.field("stripeAccountId"), stripeAccountId))
      .first();

    if (!creator) {
      console.warn(
        `[StripeOnboarding] No creator found for Stripe account ${stripeAccountId}`
      );
      return { success: false, reason: "creator_not_found" };
    }

    // Only update if not already enabled
    if (!creator.payoutEnabled) {
      await ctx.db.patch(creator._id, {
        payoutEnabled: true,
      });
      console.log(
        `[StripeOnboarding] Marked payoutEnabled=true for creator ${creator.slug}`
      );
    }

    return { success: true };
  },
});

export const createStripeAccountLink = action({
  args: {
    creatorSlug: v.string(),
  },
  handler: async (ctx, { creatorSlug }): Promise<StripeAccountLinkResponse> => {
    const creator = (await ctx.runQuery(api.stripeOnboarding.getCreatorBySlug, {
      creatorSlug,
    })) as CreatorDoc | null;

    if (!creator) {
      throw new Error(`Creator ${creatorSlug} not found`);
    }

    let stripeAccountId: string | undefined = creator.stripeAccountId;
    if (!stripeAccountId) {
      const account: Stripe.Account = await stripe.accounts.create({
        type: "express",
      });
      stripeAccountId = account.id;
      await ctx.runMutation(api.stripeOnboarding.upsertStripeAccountId, {
        creatorId: creator._id,
        stripeAccountId,
      });
    }

    const { refreshUrl, returnUrl } = buildAccountLinkUrls(creatorSlug);
    const accountLink: Stripe.AccountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
      collect: "eventually_due",
    });

    if (!accountLink.url || !accountLink.expires_at) {
      throw new Error("Stripe account link response missing required fields");
    }

    return {
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
      stripeAccountId,
    };
  },
});

// Action to verify and sync Stripe account status
// Call this when user returns from Stripe or to fix existing accounts
export const verifyAndSyncStripeStatus = action({
  args: {
    creatorSlug: v.string(),
  },
  handler: async (ctx, { creatorSlug }) => {
    const creator = (await ctx.runQuery(api.stripeOnboarding.getCreatorBySlug, {
      creatorSlug,
    })) as CreatorDoc | null;

    if (!creator) {
      return { success: false, reason: "creator_not_found" };
    }

    if (!creator.stripeAccountId) {
      return { success: false, reason: "no_stripe_account" };
    }

    // Fetch actual status from Stripe
    try {
      const account = await stripe.accounts.retrieve(creator.stripeAccountId);

      console.log(`[StripeOnboarding] Verified account ${account.id}:`, {
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
      });

      // If onboarding is complete, update our DB
      if (account.details_submitted && account.payouts_enabled) {
        if (!creator.payoutEnabled) {
          await ctx.runMutation(api.stripeOnboarding.markOnboardingComplete, {
            stripeAccountId: creator.stripeAccountId,
          });
        }
        return {
          success: true,
          onboardingComplete: true,
          detailsSubmitted: account.details_submitted,
          payoutsEnabled: account.payouts_enabled,
        };
      }

      // Onboarding not complete yet
      return {
        success: true,
        onboardingComplete: false,
        detailsSubmitted: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
      };
    } catch (error) {
      console.error("[StripeOnboarding] Failed to verify account:", error);
      return { success: false, reason: "stripe_api_error" };
    }
  },
});
