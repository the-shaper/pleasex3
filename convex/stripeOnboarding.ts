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
