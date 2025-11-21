import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const upsertCreator = internalMutation({
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
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        minPriorityTipCents: args.minPriorityTipCents,
      });
      return;
    }
    await ctx.db.insert("creators", {
      slug: args.slug,
      displayName: args.displayName,
      minPriorityTipCents: args.minPriorityTipCents,
      showAutoqueueCard: true,
    });
  },
});

export const upsertQueue = internalMutation({
  args: {
    creatorSlug: v.string(),
    kind: v.union(v.literal("personal"), v.literal("priority")),
    activeTurn: v.number(),
    nextTurn: v.number(),
    etaDays: v.number(),
    activeCount: v.number(),
    enabled: v.boolean(),
    avgDaysPerTicket: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("queues")
      .withIndex("by_creator_kind", (q) =>
        q.eq("creatorSlug", args.creatorSlug).eq("kind", args.kind)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        activeTurn: args.activeTurn,
        nextTurn: args.nextTurn,
        etaDays: args.etaDays,
        activeCount: args.activeCount,
        enabled: args.enabled,
        avgDaysPerTicket: args.avgDaysPerTicket ?? 1,
      });
      return;
    }
    await ctx.db.insert("queues", {
      creatorSlug: args.creatorSlug,
      kind: args.kind,
      activeTurn: args.activeTurn,
      nextTurn: args.nextTurn,
      etaDays: args.etaDays,
      activeCount: args.activeCount,
      enabled: args.enabled,
      avgDaysPerTicket: args.avgDaysPerTicket ?? 1,
    });
  },
});

export const createTicket = internalMutation({
  args: {
    creatorSlug: v.string(),
    queueKind: v.union(v.literal("personal"), v.literal("priority")),
    tipCents: v.number(),
    message: v.optional(v.string()),
    // Add new user contact fields for seeding
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    social: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    consentEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const ref = `${args.creatorSlug.toUpperCase()}-${Date.now()}`;
    await ctx.db.insert("tickets", {
      ref,
      creatorSlug: args.creatorSlug,
      queueKind: args.queueKind,
      tipCents: args.tipCents,
      message: args.message,
      status: "open",
      createdAt: Date.now(),
      // Add new user contact fields with defaults for seeding
      name: args.name || "Test User",
      email: args.email || "test@example.com",
      phone: args.phone,
      location: args.location,
      social: args.social,
      attachments: args.attachments,
      consentEmail: args.consentEmail ?? false,
    });
  },
});
