# Convex Functions Specification

## Overview

This document defines all the Convex functions (queries and mutations) needed to implement the ticketing system. Functions are organized by feature area and include input validation, business logic, and error handling.

## Creator Functions

### Queries

#### getCreatorBySlug

```typescript
// convex/creators.ts
export const getCreatorBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!creator) {
      throw new Error("Creator not found");
    }

    return creator;
  },
});
```

#### getCreatorQueueState

```typescript
// convex/queues.ts
export const getCreatorQueueState = query({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, { creatorId }) => {
    const queueState = await ctx.db
      .query("queueStates")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
      .first();

    if (!queueState) {
      // Initialize queue state if it doesn't exist
      return await initializeQueueState(ctx, creatorId);
    }

    return queueState;
  },
});
```

### Mutations

#### createCreator

```typescript
// convex/creators.ts
export const createCreator = mutation({
  args: {
    displayName: v.string(),
    slug: v.string(),
    minPriorityTipCents: v.number(),
    queueSettings: v.object({
      personalEnabled: v.boolean(),
      priorityEnabled: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Creator with this slug already exists");
    }

    const creatorId = await ctx.db.insert("creators", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Initialize queue state
    await initializeQueueState(ctx, creatorId);

    return creatorId;
  },
});
```

## Ticket Functions

### Queries

#### getTicketByReference

```typescript
// convex/tickets.ts
export const getTicketByReference = query({
  args: { referenceNumber: v.string() },
  handler: async (ctx, { referenceNumber }) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_referenceNumber", (q) =>
        q.eq("referenceNumber", referenceNumber)
      )
      .first();

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    return ticket;
  },
});
```

#### getTicketsByCreator

```typescript
// convex/tickets.ts
export const getTicketsByCreator = query({
  args: {
    creatorId: v.id("creators"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("completed")
      )
    ),
    queueType: v.optional(
      v.union(v.literal("personal"), v.literal("priority"))
    ),
  },
  handler: async (ctx, { creatorId, status, queueType }) => {
    let query = ctx.db
      .query("tickets")
      .withIndex("by_creatorId_status", (q) => q.eq("creatorId", creatorId));

    if (status) {
      query = query.eq("status", status);
    }

    if (queueType) {
      query = query.eq("queueType", queueType);
    }

    return await query.order("desc").collect();
  },
});
```

#### getMainQueue

```typescript
// convex/queues.ts
export const getMainQueue = query({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, { creatorId }) => {
    const queueState = await ctx.db
      .query("queueStates")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
      .first();

    if (!queueState || !queueState.mainQueue.length) {
      return [];
    }

    // Fetch tickets in queue order
    const tickets = await Promise.all(
      queueState.mainQueue.map((ticketId) => ctx.db.get(ticketId))
    );

    // Filter out null results and sort by queue position
    return tickets
      .filter((ticket) => ticket !== null)
      .map((ticket, index) => ({
        ...ticket,
        position: index + 1,
      }));
  },
});
```

### Mutations

#### submitTicket

```typescript
// convex/tickets.ts
export const submitTicket = mutation({
  args: {
    creatorId: v.id("creators"),
    queueType: v.union(v.literal("personal"), v.literal("priority")),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    social: v.optional(v.string()),
    needText: v.string(),
    attachments: v.array(v.string()),
    priorityTipCents: v.number(),
    consentEmail: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate email
    if (!args.email.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Check if creator exists
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) {
      throw new Error("Creator not found");
    }

    // Validate queue type is enabled
    const queueState = await getCreatorQueueState(ctx, {
      creatorId: args.creatorId,
    });
    const queue =
      args.queueType === "priority"
        ? queueState.priorityQueue
        : queueState.personalQueue;

    if (!queue.enabled) {
      throw new Error(`${args.queueType} queue is currently closed`);
    }

    // Validate minimum tip for priority queue
    if (
      args.queueType === "priority" &&
      args.priorityTipCents < creator.minPriorityTipCents
    ) {
      throw new Error(
        `Minimum tip for priority queue is $${(
          creator.minPriorityTipCents / 100
        ).toFixed(2)}`
      );
    }

    // Generate reference number
    const referenceNumber = generateReferenceNumber(
      args.creatorId,
      args.queueType
    );

    // Create ticket
    const ticketId = await ctx.db.insert("tickets", {
      ...args,
      status: "pending",
      submittedAt: Date.now(),
      referenceNumber,
    });

    // Update queue state
    await updateQueueMetrics(ctx, args.creatorId, args.queueType);

    return { ticketId, referenceNumber };
  },
});
```

#### approveTicket

```typescript
// convex/tickets.ts
export const approveTicket = mutation({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.status !== "pending") {
      throw new Error("Ticket is not pending");
    }

    // Update ticket status
    await ctx.db.patch(ticketId, {
      status: "approved",
      approvedAt: Date.now(),
    });

    // Add to main queue
    await addToMainQueue(ctx, ticket.creatorId, ticketId);

    return true;
  },
});
```

#### rejectTicket

```typescript
// convex/tickets.ts
export const rejectTicket = mutation({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.status !== "pending") {
      throw new Error("Ticket is not pending");
    }

    // Update ticket status
    await ctx.db.patch(ticketId, {
      status: "rejected",
    });

    // Update queue metrics
    await updateQueueMetrics(ctx, ticket.creatorId, ticket.queueType);

    return true;
  },
});
```

#### completeTicket

```typescript
// convex/tickets.ts
export const completeTicket = mutation({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.status !== "approved") {
      throw new Error("Ticket is not approved");
    }

    // Update ticket status
    await ctx.db.patch(ticketId, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Remove from main queue and update positions
    await removeFromMainQueue(ctx, ticket.creatorId, ticketId);

    return true;
  },
});
```

## Queue Management Functions

### Internal Functions

#### initializeQueueState

```typescript
// convex/queues.ts
async function initializeQueueState(ctx: any, creatorId: Id<"creators">) {
  const queueState = {
    creatorId,
    personalQueue: {
      activeTurn: null,
      nextTurn: 1,
      activeCount: 0,
      etaMins: null,
      enabled: true,
    },
    priorityQueue: {
      activeTurn: null,
      nextTurn: 1,
      activeCount: 0,
      etaMins: null,
      enabled: true,
    },
    mainQueue: [],
    lastUpdated: Date.now(),
  };

  const id = await ctx.db.insert("queueStates", queueState);
  return await ctx.db.get(id);
}
```

#### updateQueueMetrics

```typescript
// convex/queues.ts
async function updateQueueMetrics(
  ctx: any,
  creatorId: Id<"creators">,
  queueType: "personal" | "priority"
) {
  const queueState = await ctx.db
    .query("queueStates")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
    .first();

  if (!queueState) {
    throw new Error("Queue state not found");
  }

  // Count active tickets
  const activeCount = await ctx.db
    .query("tickets")
    .withIndex("by_creatorId_status", (q) =>
      q
        .eq("creatorId", creatorId)
        .eq("status", "approved")
        .eq("queueType", queueType)
    )
    .count();

  // Calculate ETA (simplified - could be made more sophisticated)
  const avgTimePerTicket = queueType === "priority" ? 30 : 60; // minutes
  const etaMins = activeCount * avgTimePerTicket;

  // Update queue state
  const queueKey = `${queueType}Queue` as "personalQueue" | "priorityQueue";
  await ctx.db.patch(queueState._id, {
    [queueKey]: {
      ...queueState[queueKey],
      activeCount,
      etaMins,
    },
    lastUpdated: Date.now(),
  });
}
```

#### addToMainQueue

```typescript
// convex/queues.ts
async function addToMainQueue(
  ctx: any,
  creatorId: Id<"creators">,
  ticketId: Id<"tickets">
) {
  const queueState = await ctx.db
    .query("queueStates")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
    .first();

  if (!queueState) {
    throw new Error("Queue state not found");
  }

  // Get ticket to determine queue type
  const ticket = await ctx.db.get(ticketId);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // Add to main queue maintaining 3:1 priority:personal ratio
  const newMainQueue = insertWithRatio(
    queueState.mainQueue,
    ticketId,
    ticket.queueType
  );

  await ctx.db.patch(queueState._id, {
    mainQueue: newMainQueue,
    lastUpdated: Date.now(),
  });
}
```

#### insertWithRatio

```typescript
// convex/queues.ts
async function insertWithRatio(
  mainQueue: Id<"tickets">[],
  ticketId: Id<"tickets">,
  queueType: "personal" | "priority"
): Promise<Id<"tickets">[]> {
  // Get queue types of existing tickets
  const ticketTypes = await Promise.all(
    mainQueue.map(async (id) => {
      const ticket = await ctx.db.get(id);
      return ticket?.queueType;
    })
  );

  // Find insertion point maintaining 3:1 ratio
  let priorityCount = 0;
  let personalCount = 0;
  let insertIndex = mainQueue.length;

  for (let i = 0; i < ticketTypes.length; i++) {
    if (ticketTypes[i] === "priority") {
      priorityCount++;
    } else {
      personalCount++;
    }

    // Check if we can insert here
    if (queueType === "priority" && priorityCount < personalCount * 3 + 3) {
      insertIndex = i + 1;
      break;
    } else if (
      queueType === "personal" &&
      personalCount < Math.ceil(priorityCount / 3)
    ) {
      insertIndex = i + 1;
      break;
    }
  }

  // Insert at calculated position
  const newQueue = [...mainQueue];
  newQueue.splice(insertIndex, 0, ticketId);

  return newQueue;
}
```

## Utility Functions

#### generateReferenceNumber

```typescript
// convex/utils.ts
function generateReferenceNumber(
  creatorId: Id<"creators">,
  queueType: "personal" | "priority"
): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const prefix = queueType === "priority" ? "P" : "L";
  return `${prefix}-${timestamp}-${random}`;
}
```

## Real-time Subscriptions

### Queue State Subscription

```typescript
// Client-side
const queueState = useQuery(api.queues.getCreatorQueueState, { creatorId });
```

### Ticket Updates Subscription

```typescript
// Client-side
const tickets = useQuery(api.tickets.getTicketsByCreator, {
  creatorId,
  status: "pending",
});
```

### Main Queue Subscription

```typescript
// Client-side
const mainQueue = useQuery(api.queues.getMainQueue, { creatorId });
```
