import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getQueueSnapshot } from "./lib/ticketEngine";
import { requireCreatorOwnership } from "./lib/auth";

export const getSnapshot = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    // This is used by the dashboard, so we should protect it.
    // If public page needs it, we might need a separate public query or allow it.
    // Usually public page needs snapshot too.
    // Let's check if we can distinguish or if we should leave it open.
    // The public page definitely needs to know if queue is enabled and ETA.
    // So getSnapshot might need to be public.
    // BUT, the dashboard uses it too.
    // If we lock it, public page breaks.
    // Let's NOT lock getSnapshot for now, as it returns public info (ETA, enabled status).
    // Wait, does it return sensitive info?
    // It returns activeTurn, nextTurn, etaDays, activeCount, enabled.
    // This seems fine for public.
    return await getQueueSnapshot(ctx, args.creatorSlug);
  },
});

export const getSettings = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorSlug);
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.creatorSlug))
      .unique();

    return creator?.showAutoqueueCard ?? true; // Default to true
  },
});

export const updateSettings = mutation({
  args: {
    creatorSlug: v.string(),
    showAutoqueueCard: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorSlug);
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.creatorSlug))
      .unique();

    if (!creator) {
      throw new Error(`Creator not found: ${args.creatorSlug}`);
    }

    await ctx.db.patch(creator._id, {
      showAutoqueueCard: args.showAutoqueueCard,
    });

    return { success: true };
  },
});

export const toggleEnabled = mutation({
  args: {
    creatorSlug: v.string(),
    kind: v.union(v.literal("personal"), v.literal("priority")),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorSlug);
    console.log(`Toggling queue for ${args.creatorSlug}/${args.kind}`);

    let queue = await ctx.db
      .query("queues")
      .withIndex("by_creator_kind", (q) =>
        q.eq("creatorSlug", args.creatorSlug).eq("kind", args.kind)
      )
      .unique();

    if (!queue) {
      console.log(
        `Creating missing queue for ${args.creatorSlug}/${args.kind}`
      );
      await ctx.db.insert("queues", {
        creatorSlug: args.creatorSlug,
        kind: args.kind,
        activeTurn: 0,
        nextTurn: 1,

        etaDays: 0,
        activeCount: 0,
        enabled: args.kind === "personal",
      });
      queue = await ctx.db
        .query("queues")
        .withIndex("by_creator_kind", (q) =>
          q.eq("creatorSlug", args.creatorSlug).eq("kind", args.kind)
        )
        .unique();

      if (!queue) {
        throw new Error("Insert succeeded but re-query failed - retry");
      }
    }

    const newEnabled = !queue.enabled;
    await ctx.db.patch(queue._id, { enabled: newEnabled });

    return { success: true, enabled: newEnabled, queue };
  },
});

export const updateQueueSettings = mutation({
  args: {
    creatorSlug: v.string(),
    kind: v.union(v.literal("personal"), v.literal("priority")),
    avgDaysPerTicket: v.number(),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorSlug);
    let queue = await ctx.db
      .query("queues")
      .withIndex("by_creator_kind", (q) =>
        q.eq("creatorSlug", args.creatorSlug).eq("kind", args.kind)
      )
      .unique();

    if (!queue) {
      // Create if missing (similar to toggleEnabled logic, but maybe safer to just error if it should exist? 
      // For now, let's create it to be safe as settings might be accessed before toggle)
      const id = await ctx.db.insert("queues", {
        creatorSlug: args.creatorSlug,
        kind: args.kind,
        activeTurn: 0,
        nextTurn: 1,
        etaDays: 0,
        activeCount: 0,
        enabled: args.kind === "personal",
        avgDaysPerTicket: args.avgDaysPerTicket,
      });
      return { success: true };
    }

    await ctx.db.patch(queue._id, {
      avgDaysPerTicket: args.avgDaysPerTicket,
    });

    return { success: true };
  },
});

export const ensureQueueExists = mutation({
  args: {
    creatorSlug: v.string(),
    kind: v.union(v.literal("personal"), v.literal("priority")),
  },
  handler: async (ctx, args) => {
    // NOTE: No auth check here - this is a system-level function called during
    // ticket submission by unauthenticated users. It ensures queue records exist
    // for data integrity.
    const queue = await ctx.db
      .query("queues")
      .withIndex("by_creator_kind", (q) =>
        q.eq("creatorSlug", args.creatorSlug).eq("kind", args.kind)
      )
      .unique();

    if (!queue) {
      await ctx.db.insert("queues", {
        creatorSlug: args.creatorSlug,
        kind: args.kind,
        activeTurn: 0,
        nextTurn: 1,
        etaDays: 0,
        activeCount: 0,
        enabled: args.kind === "personal",
        avgDaysPerTicket: 1, // Default 1 day
      });
    }
  },
});
