import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    slug: v.string(),
    displayName: v.string(),
    minPriorityTipCents: v.number(),
  },
  handler: async (ctx, args) => {
    // Insert creator
    const creatorId = await ctx.db.insert("creators", {
      slug: args.slug,
      displayName: args.displayName,
      minPriorityTipCents: args.minPriorityTipCents,
      showAutoqueueCard: true,
    });

    // Insert personal queue (enabled by default)
    await ctx.db.insert("queues", {
      creatorSlug: args.slug,
      kind: "personal",
      activeTurn: 0,
      nextTurn: 1,
      etaMins: 0,
      activeCount: 0,
      enabled: true,
    });

    // Insert priority queue (enabled by default)
    await ctx.db.insert("queues", {
      creatorSlug: args.slug,
      kind: "priority",
      activeTurn: 0,
      nextTurn: 1,
      etaMins: 0,
      activeCount: 0,
      enabled: true,
    });

    return { success: true, creatorId };
  },
});

export const upsertBySlug = mutation({
  args: {
    slug: v.string(),
    displayName: v.string(),
    minPriorityTipCents: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      return { creatorId: existing._id };
    }

    const creatorId = await ctx.db.insert("creators", {
      slug: args.slug,
      displayName: args.displayName,
      minPriorityTipCents: args.minPriorityTipCents,
      showAutoqueueCard: true,
    });

    return { creatorId };
  },
});
