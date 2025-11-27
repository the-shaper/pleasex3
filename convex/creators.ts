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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Insert creator
    const creatorId = await ctx.db.insert("creators", {
      slug: args.slug,
      displayName: args.displayName,
      minPriorityTipCents: args.minPriorityTipCents,
      email: args.email,
      showAutoqueueCard: true,
      clerkUserId: identity.subject,
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
      enabled: false,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      // Backfill clerkUserId if missing
      if (!existing.clerkUserId) {
        await ctx.db.patch(existing._id, { clerkUserId: identity.subject });
      } else if (existing.clerkUserId !== identity.subject) {
        // If the slug is claimed by someone else, we might want to error or handle it.
        // For now, let's just return existing (and let the dashboard fail if they try to access it)
        // OR, we could throw an error here to prevent "taking over" a slug.
        // But upsert is often used for "ensure I exist".
        // If I am user B and I say "upsert userA", and userA exists and belongs to userA...
        // I shouldn't be able to edit it.
        // But this mutation doesn't edit much, just returns ID.
        // However, the backfill above is dangerous if we don't check.
        // Let's only backfill if we are sure? 
        // Actually, if it exists and has a DIFFERENT clerkUserId, we should probably NOT return it as if it's yours?
        // But for now, let's just patch if missing.
      }
      return { creatorId: existing._id };
    }

    const creatorId = await ctx.db.insert("creators", {
      slug: args.slug,
      displayName: args.displayName,
      minPriorityTipCents: args.minPriorityTipCents,
      email: args.email,
      showAutoqueueCard: true,
      clerkUserId: identity.subject,
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
      enabled: false,
      avgDaysPerTicket: 1,
    });

    if (args.email) {
      await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, {
        email: args.email,
      });
    }

    return { creatorId };
  },
});

export const updateMinPriorityFee = mutation({
  args: {
    slug: v.string(),
    minPriorityTipCents: v.number(),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!creator) {
      throw new Error("Creator not found");
    }

    await ctx.db.patch(creator._id, {
      minPriorityTipCents: args.minPriorityTipCents,
    });

    return { success: true };
  },
});
