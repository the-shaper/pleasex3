import { query } from "./_generated/server";
import { v } from "convex/values";

// Debug query to test queue calculations
export const debugQueueMetrics = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    return await calculateQueueMetrics(ctx, args.creatorSlug);
  },
});

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

    // Get calculated queue data instead of using stored values
    let queueData;
    try {
      queueData = await calculateQueueMetrics(ctx, args.creatorSlug);
      console.log(
        "Queue data for",
        args.creatorSlug,
        ":",
        JSON.stringify(queueData)
      );
    } catch (error) {
      console.error("Error calculating queue metrics:", error);
      queueData = {
        personal: {
          kind: "personal",
          activeTurn: 0,
          nextTurn: 1,
          etaMins: 0,
          activeCount: 0,
          enabled: false,
        },
        priority: {
          kind: "priority",
          activeTurn: 0,
          nextTurn: 1,
          etaMins: 0,
          activeCount: 0,
          enabled: false,
        },
        general: {
          kind: "general",
          activeTurn: 0,
          nextTurn: 2,
          etaMins: 0,
          activeCount: 0,
          enabled: false,
        },
      };
    }

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
      queues: queueData,
      openTickets: allTickets.filter((t) => t.status === "open"),
      approvedTickets: allTickets.filter((t) => t.status === "approved"),
    };
  },
});

export const getAllTicketsWithPositions = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    const allTickets = await ctx.db
      .query("tickets")
      .withIndex("by_creator", (q) => q.eq("creatorSlug", args.creatorSlug))
      .collect();

    // Sort by creation time (oldest first)
    allTickets.sort((a, b) => a.createdAt - b.createdAt);

    // Calculate positions for each ticket
    const ticketsWithPositions = allTickets.map((ticket, index) => {
      // Calculate general number (position across all tickets)
      const generalNumber = index + 1;

      // Calculate ticket number (position within queue type)
      const ticketsInSameQueue = allTickets
        .filter(t => t.queueKind === ticket.queueKind)
        .sort((a, b) => a.createdAt - b.createdAt);

      const ticketNumber = ticketsInSameQueue.findIndex(t => t.ref === ticket.ref) + 1;

      return {
        ...ticket,
        generalNumber,
        ticketNumber
      };
    });

    return ticketsWithPositions;
  }
});

// Helper function to calculate real queue metrics based on approved tickets
async function calculateQueueMetrics(ctx: any, creatorSlug: string) {
  // Get all approved tickets for this creator, sorted by creation time
  const allTickets = await ctx.db
    .query("tickets")
    .withIndex("by_creator", (q: any) => q.eq("creatorSlug", creatorSlug))
    .collect();

  const approvedTickets = allTickets.filter(
    (t: any) => t.status === "approved"
  );

  // Sort by creation time (oldest first)
  approvedTickets.sort((a: any, b: any) => a.createdAt - b.createdAt);

  // Group tickets by queue kind
  const personalTickets = approvedTickets.filter(
    (t: any) => t.queueKind === "personal"
  );
  const priorityTickets = approvedTickets.filter(
    (t: any) => t.queueKind === "priority"
  );

  // For now, use simple position calculation
  // In a full implementation, this would use the main queue algorithm
  const personalActiveTurn = personalTickets.length > 0 ? 1 : 0;
  const priorityActiveTurn = priorityTickets.length > 0 ? 1 : 0;

  // Calculate next turn numbers (position for next person in line)
  const personalNextTurn = personalTickets.length + 1;
  const priorityNextTurn = priorityTickets.length + 1;

  // Estimate ETAs (rough calculation - in a real system this would be based on historical data)
  const avgProcessingTimeMins = 30; // Assume 30 minutes per ticket on average
  const personalEtaMins = personalTickets.length * avgProcessingTimeMins;
  const priorityEtaMins = priorityTickets.length * avgProcessingTimeMins;

  // General queue combines both
  const generalActiveTurn = personalActiveTurn + priorityActiveTurn;
  const generalNextTurn = personalNextTurn + priorityNextTurn;
  const generalActiveCount = personalTickets.length + priorityTickets.length;
  const generalEtaMins = Math.min(
    personalEtaMins || Infinity,
    priorityEtaMins || Infinity
  );
  const finalGeneralEtaMins = generalEtaMins === Infinity ? 0 : generalEtaMins;

  return {
    personal: {
      kind: "personal",
      activeTurn: personalActiveTurn,
      nextTurn: personalNextTurn,
      etaMins: personalEtaMins,
      activeCount: personalTickets.length,
      enabled: personalTickets.length > 0, // Enable if there are tickets
    },
    priority: {
      kind: "priority",
      activeTurn: priorityActiveTurn,
      nextTurn: priorityNextTurn,
      etaMins: priorityEtaMins,
      activeCount: priorityTickets.length,
      enabled: priorityTickets.length > 0, // Enable if there are tickets
    },
    general: {
      kind: "general",
      activeTurn: generalActiveTurn,
      nextTurn: generalNextTurn,
      etaMins: finalGeneralEtaMins,
      activeCount: generalActiveCount,
      enabled: generalActiveCount > 0, // Enable if there are tickets
    },
  };
}
