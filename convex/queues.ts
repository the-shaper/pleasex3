import { query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to calculate real queue metrics based on approved tickets
async function calculateQueueMetrics(ctx: any, creatorSlug: string) {
  // Check if creator exists first - this determines if queues should be enabled
  const creator = await ctx.db
    .query("creators")
    .withIndex("by_slug", (q: any) => q.eq("slug", creatorSlug))
    .unique();

  const creatorExists = creator !== null;

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
      enabled: creatorExists, // Enable if creator exists
    },
    priority: {
      kind: "priority",
      activeTurn: priorityActiveTurn,
      nextTurn: priorityNextTurn,
      etaMins: priorityEtaMins,
      activeCount: priorityTickets.length,
      enabled: creatorExists, // Enable if creator exists
    },
    general: {
      kind: "general",
      activeTurn: generalActiveTurn,
      nextTurn: generalNextTurn,
      etaMins: finalGeneralEtaMins,
      activeCount: generalActiveCount,
      enabled: creatorExists, // Enable if creator exists
    },
  };
}

export const getSnapshot = query({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    // Use calculated queue metrics instead of stored values
    return await calculateQueueMetrics(ctx, args.creatorSlug);
  },
});
