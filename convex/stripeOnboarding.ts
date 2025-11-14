import { mutation } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

const stripeApiKey = process.env.STRIPE_API_KEY;
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

if (!stripeApiKey) {
  throw new Error("STRIPE_API_KEY is required for Stripe onboarding");
}

const stripe = new Stripe(stripeApiKey, { apiVersion: "2022-11-15" });

function buildAccountLinkUrls(slug: string) {
  const normalized = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const earningsUrl = `${normalized}/${slug}/dashboard?tab=earnings`;
  return {
    refreshUrl: earningsUrl,
    returnUrl: earningsUrl,
  };
}

export const createStripeAccountLink = mutation({
  args: {
    creatorSlug: v.string(),
  },
  handler: async (ctx, { creatorSlug }) => {
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q: any) => q.eq("slug", creatorSlug))
      .unique();

    if (!creator) {
      throw new Error(`Creator ${creatorSlug} not found`);
    }

    let stripeAccountId = creator.stripeAccountId;
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
      });
      stripeAccountId = account.id;
      await ctx.db.patch(creator._id, {
        stripeAccountId,
        payoutEnabled: false,
      });
    }

    const { refreshUrl, returnUrl } = buildAccountLinkUrls(creatorSlug);
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
      collect: "eventually_due",
    });

    return {
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
      stripeAccountId,
    };
  },
});

