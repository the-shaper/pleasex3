import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const create = mutation({
  args: {
    slug: v.string(),
    displayName: v.string(),
    minPriorityTipCents: v.number(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Insert creator
    const creatorId = await ctx.db.insert("creators", {
      slug: args.slug,
      displayName: args.displayName,
      minPriorityTipCents: args.minPriorityTipCents,
      email: args.email,
      showAutoqueueCard: true,
    });

    // Insert personal queue (enabled by default)
    await ctx.db.insert("queues", {
      creatorSlug: args.slug,
      kind: "personal",
      activeTurn: 0,
      nextTurn: 1,
      etaDays: 0,
      activeCount: 0,
      enabled: true,
      avgDaysPerTicket: 1,
    });

    // Insert priority queue (enabled by default)
    await ctx.db.insert("queues", {
      creatorSlug: args.slug,
      kind: "priority",
      activeTurn: 0,
      nextTurn: 1,
      etaDays: 0,
      activeCount: 0,
      enabled: true,
      avgDaysPerTicket: 1,
    });

    if (args.email) {
      await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, {
        email: args.email,
      });
    }

    return { success: true, creatorId };
  },
});

export const upsertBySlug = mutation({
  args: {
    slug: v.string(),
    displayName: v.string(),
    minPriorityTipCents: v.number(),
    email: v.optional(v.string()),
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
      email: args.email,
      showAutoqueueCard: true,
    });

    if (args.email) {
      await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, {
        email: args.email,
      });
    }

    return { creatorId };
  },
});
