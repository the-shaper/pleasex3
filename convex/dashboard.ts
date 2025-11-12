import { query } from "./_generated/server";
import { v } from "convex/values";
import { getQueueSnapshot, getTicketPositions, getNextTicketNumbersForCreator, getTicketPosition } from "./lib/ticketEngine";

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

export const getOverview = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.creatorSlug))
      .unique();

    const queues = await getQueueSnapshot(ctx, args.creatorSlug);

    const allTickets = await ctx.db
      .query("tickets")
      .withIndex("by_creator", (q: any) =>
        q.eq("creatorSlug", args.creatorSlug)
      )
      .collect();

    return {
      creator: creator ?? {
        slug: args.creatorSlug,
        displayName: args.creatorSlug,
        minPriorityTipCents: 1500,
      },
      queues,
      openTickets: allTickets.filter((t) => t.status === "open"),
      approvedTickets: allTickets.filter((t) => t.status === "approved"),
      closedTickets: allTickets.filter((t) => t.status === "closed"),
      rejectedTickets: allTickets.filter((t) => t.status === "rejected"),
    };
  },
});

export const getAllTicketsWithPositions = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    const positions = await getTicketPositions(ctx, args.creatorSlug);
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
    return await getTicketPosition(ctx, args.ref, args.creatorSlug);
  },
});
