import { query, mutation } from "./_generated/server";
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
    // Check creator for fallback
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.creatorSlug))
      .unique();

    const creatorExists = creator !== null;

    // Fetch actual queues for enabled
    const personalQueue = await ctx.db
      .query("queues")
      .withIndex("by_creator_kind", (q) =>
        q.eq("creatorSlug", args.creatorSlug).eq("kind", "personal")
      )
      .unique();
    const priorityQueue = await ctx.db
      .query("queues")
      .withIndex("by_creator_kind", (q) =>
        q.eq("creatorSlug", args.creatorSlug).eq("kind", "priority")
      )
      .unique();

    // Dynamic metrics from tickets (existing)
    const allTickets = await ctx.db
      .query("tickets")
      .withIndex("by_creator", (q) => q.eq("creatorSlug", args.creatorSlug))
      .collect();

    const approvedTickets = allTickets.filter((t) => t.status === "approved");
    approvedTickets.sort((a, b) => a.createdAt - b.createdAt);

    const personalTickets = approvedTickets.filter(
      (t) => t.queueKind === "personal"
    );
    const priorityTickets = approvedTickets.filter(
      (t) => t.queueKind === "priority"
    );

    const avgProcessingTimeMins = 30;
    const personalEtaMins = personalTickets.length * avgProcessingTimeMins;
    const priorityEtaMins = priorityTickets.length * avgProcessingTimeMins;

    const generalActiveCount = personalTickets.length + priorityTickets.length;
    const generalEtaMins = Math.min(
      personalEtaMins || Infinity,
      priorityEtaMins || Infinity
    );
    const finalGeneralEtaMins =
      generalEtaMins === Infinity ? 0 : generalEtaMins;

    return {
      personal: {
        kind: "personal",
        activeTurn: personalTickets.length > 0 ? 1 : 0,
        nextTurn: personalTickets.length + 1,
        etaMins: personalEtaMins,
        activeCount: personalTickets.length,
        enabled: personalQueue?.enabled ?? creatorExists, // Use DB or fallback
      },
      priority: {
        kind: "priority",
        activeTurn: priorityTickets.length > 0 ? 1 : 0,
        nextTurn: priorityTickets.length + 1,
        etaMins: priorityEtaMins,
        activeCount: priorityTickets.length,
        enabled: priorityQueue?.enabled ?? creatorExists, // Use DB or fallback
      },
      general: {
        kind: "general",
        activeTurn:
          (personalTickets.length > 0 ? 1 : 0) +
          (priorityTickets.length > 0 ? 1 : 0),
        nextTurn: personalTickets.length + 1 + (priorityTickets.length + 1),
        etaMins: finalGeneralEtaMins,
        activeCount: generalActiveCount,
        enabled: creatorExists, // General always creator-based
      },
    };
  },
});

export const toggleEnabled = mutation({
  args: {
    creatorSlug: v.string(),
    kind: v.union(v.literal("personal"), v.literal("priority")),
  },
  handler: async (ctx, args) => {
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
        etaMins: 0,
        activeCount: 0,
        enabled: true, // Default active
      });
      // Re-query (guaranteed to exist now)
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

    console.log(
      `Current enabled: ${queue.enabled}, toggling to ${!queue.enabled}`
    );
    // Safe: queue is non-null
    const newEnabled = !queue.enabled;
    await ctx.db.patch(queue._id, { enabled: newEnabled });

    console.log(`Updated queue enabled to ${newEnabled}`);

    return { success: true, enabled: newEnabled, queue }; // Return full queue for debug
  },
});
