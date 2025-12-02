import { query } from "./_generated/server";
import { v } from "convex/values";
import { getQueueSnapshot, getTicketPositions, getActiveTicketPositions as getActiveTicketPositionsEngine, getNextTicketNumbersForCreator, getTicketPosition, type TicketPosition } from "./lib/ticketEngine";
import { requireCreatorOwnership } from "./lib/auth";

export const getCreator = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.creatorSlug))
      .unique();

    return creator;
  },
});

export const getAllCreators = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("creators").collect();
  },
});

export const getOverview = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    const creator = await requireCreatorOwnership(ctx, args.creatorSlug, { throwIfNotFound: false });

    if (!creator) {
      return null;
    }

    const queues = await getQueueSnapshot(ctx, args.creatorSlug);

    const allTickets = await ctx.db
      .query("tickets")
      .withIndex("by_creator", (q) =>
        q.eq("creatorSlug", args.creatorSlug)
      )
      .collect();

    const openTickets = allTickets.filter((t) => t.status === "open");

    return {
      creator,
      queues,
      openTickets,
      approvedTickets: allTickets.filter((t) => t.status === "approved"),
      closedTickets: allTickets.filter((t) => t.status === "closed"),
      rejectedTickets: allTickets.filter((t) => t.status === "rejected"),
      pendingPaymentTickets: allTickets.filter((t) => t.status === "pending_payment" && t.paymentStatus !== "pending"),
    };
  },
});

export const getAllTicketsWithPositions = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    const creator = await requireCreatorOwnership(ctx, args.creatorSlug, { throwIfNotFound: false });
    if (!creator) return [];
    const positions = await getTicketPositions(ctx, args.creatorSlug);
    return positions;
  },
});

export const getActiveTicketPositions = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args): Promise<TicketPosition[]> => {
    const creator = await requireCreatorOwnership(ctx, args.creatorSlug, { throwIfNotFound: false });
    if (!creator) return [];
    const positions = await getActiveTicketPositionsEngine(ctx, args.creatorSlug);
    return positions;
  },
});

export const getNextTicketNumbers = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    return await getNextTicketNumbersForCreator(ctx, args.creatorSlug);
  },
});

export const getTicketPositionByRef = query({
  args: { creatorSlug: v.string(), ref: v.string() },
  handler: async (ctx, args) => {
    // This one might be public? But usually dashboard uses it.
    // If it's for public page, we shouldn't require ownership.
    // But the name implies it's a specific lookup.
    // Let's assume it's for dashboard for now.
    // Wait, public page might need to know position.
    // Let's check usage. If it's used in dashboard/page.tsx, it needs auth.
    // If used in [slug]/page.tsx (public), it shouldn't.
    // Given the file is "dashboard.ts", let's protect it.
    await requireCreatorOwnership(ctx, args.creatorSlug);
    return await getTicketPosition(ctx, args.ref, args.creatorSlug);
  },
});

export const getCreatorStatusMetrics = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    // Verify ownership - only the creator can see their status metrics
    const creator = await requireCreatorOwnership(ctx, args.creatorSlug, { throwIfNotFound: false });

    if (!creator) {
      return null;
    }

    // Get all tickets for this creator
    const allTickets = await ctx.db
      .query("tickets")
      .withIndex("by_creator", (q) =>
        q.eq("creatorSlug", args.creatorSlug)
      )
      .collect();

    // Count active approved tickets (excluding awaiting-feedback)
    // These are the "queued tasks" in the active panel
    const queuedTasks = allTickets.filter((t) => {
      if (t.status !== "approved") return false;
      const tags = t.tags || [];
      // Exclude tickets that are awaiting-feedback (paused)
      return !tags.includes("awaiting-feedback");
    }).length;

    // Count tickets awaiting approval
    // Includes: open (free) + pending_payment that have been authorized
    const newRequests = allTickets.filter((t) => {
      if (t.status === "open") return true;
      if (t.status === "pending_payment" && t.paymentStatus !== "pending") return true;
      return false;
    }).length;

    return {
      queuedTasks,
      newRequests,
    };
  },
});
