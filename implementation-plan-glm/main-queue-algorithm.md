# Main Queue Algorithm Implementation Plan

## Overview

The main queue algorithm manages the ordering of approved tickets following a 3:1 priority:personal ratio. This ensures priority tickets are processed more frequently while still allowing personal tickets to be handled in a timely manner.

## Algorithm Requirements

1. **Maintain 3:1 Ratio**: For every 1 personal ticket, process 3 priority tickets
2. **Preserve Order**: Maintain original submission order within each queue type
3. **Dynamic Insertion**: Add new approved tickets to the correct position
4. **Efficient Updates**: Recalculate positions when tickets are completed
5. **Real-time Updates**: Provide live position updates to users

## Data Structure

### Queue State Representation

```typescript
interface MainQueueState {
  ticketIds: Id<"tickets">[];
  lastUpdated: number;
  ratioConfig: {
    priorityCount: number;
    personalCount: number;
  };
}
```

### Ticket Position Cache

```typescript
interface TicketPosition {
  ticketId: Id<"tickets">;
  position: number;
  queueType: "priority" | "personal";
  calculatedAt: number;
}
```

## Core Algorithm Implementation

### 1. Initial Queue Building

```typescript
// convex/queueAlgorithm.ts
export async function buildMainQueue(
  ctx: any,
  creatorId: Id<"creators">
): Promise<Id<"tickets">[]> {
  // Fetch all approved tickets
  const approvedTickets = await ctx.db
    .query("tickets")
    .withIndex("by_creatorId_status", (q) =>
      q.eq("creatorId", creatorId).eq("status", "approved")
    )
    .collect();

  // Separate by queue type while preserving order
  const priorityTickets = approvedTickets
    .filter((t) => t.queueType === "priority")
    .sort((a, b) => a.submittedAt - b.submittedAt);

  const personalTickets = approvedTickets
    .filter((t) => t.queueType === "personal")
    .sort((a, b) => a.submittedAt - b.submittedAt);

  // Interleave following 3:1 ratio
  return interleaveTickets(priorityTickets, personalTickets);
}

function interleaveTickets(
  priorityTickets: Ticket[],
  personalTickets: Ticket[]
): Id<"tickets">[] {
  const result: Id<"tickets">[] = [];
  let pIndex = 0;
  let lIndex = 0;

  while (pIndex < priorityTickets.length || lIndex < personalTickets.length) {
    // Add up to 3 priority tickets
    for (let i = 0; i < 3 && pIndex < priorityTickets.length; i++) {
      result.push(priorityTickets[pIndex]._id);
      pIndex++;
    }

    // Add 1 personal ticket if available
    if (lIndex < personalTickets.length) {
      result.push(personalTickets[lIndex]._id);
      lIndex++;
    }
  }

  return result;
}
```

### 2. Dynamic Insertion Algorithm

```typescript
// convex/queueAlgorithm.ts
export async function insertTicketIntoMainQueue(
  ctx: any,
  creatorId: Id<"creators">,
  ticketId: Id<"tickets">
): Promise<void> {
  // Get current queue state
  const queueState = await ctx.db
    .query("queueStates")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
    .first();

  if (!queueState) {
    throw new Error("Queue state not found");
  }

  // Get ticket details
  const ticket = await ctx.db.get(ticketId);
  if (!ticket || ticket.status !== "approved") {
    throw new Error("Invalid ticket for queue insertion");
  }

  // Calculate insertion position
  const newPosition = calculateInsertionPosition(
    queueState.mainQueue,
    ticket.queueType,
    ticket.submittedAt
  );

  // Insert ticket at calculated position
  const newQueue = [...queueState.mainQueue];
  newQueue.splice(newPosition, 0, ticketId);

  // Update queue state
  await ctx.db.patch(queueState._id, {
    mainQueue: newQueue,
    lastUpdated: Date.now(),
  });

  // Update position cache
  await updatePositionCache(ctx, queueState._id, newQueue);
}

function calculateInsertionPosition(
  currentQueue: Id<"tickets">[],
  ticketType: "priority" | "personal",
  submittedAt: number
): number {
  let priorityCount = 0;
  let personalCount = 0;

  // Find the position that maintains the 3:1 ratio
  for (let i = 0; i <= currentQueue.length; i++) {
    if (ticketType === "priority") {
      // Can insert if we haven't reached 3 priority tickets yet
      if (priorityCount < 3) {
        return i;
      }
      // Otherwise, find next cycle
      if (personalCount >= 1) {
        priorityCount = 0;
        personalCount = 0;
      }
    } else {
      // Personal ticket - can only insert after 3 priority tickets
      if (priorityCount >= 3 && personalCount < 1) {
        return i;
      }
    }

    // Count tickets at current position
    if (i < currentQueue.length) {
      // Would need to fetch ticket type here
      // For efficiency, we'll store this info separately
    }
  }

  // If no suitable position found, add to end
  return currentQueue.length;
}
```

### 3. Enhanced Insertion with Queue Type Cache

```typescript
// convex/queueAlgorithm.ts
interface QueueTypeInfo {
  ticketId: Id<"tickets">;
  queueType: "priority" | "personal";
  submittedAt: number;
}

export async function insertTicketOptimized(
  ctx: any,
  creatorId: Id<"creators">,
  ticketId: Id<"tickets">
): Promise<void> {
  const queueState = await getQueueState(ctx, creatorId);
  const ticket = await ctx.db.get(ticketId);

  if (!ticket || ticket.status !== "approved") {
    throw new Error("Invalid ticket");
  }

  // Build type cache for efficient calculation
  const queueTypeCache = await buildQueueTypeCache(ctx, queueState.mainQueue);

  // Find insertion point
  const insertionPoint = findOptimalInsertionPoint(
    queueTypeCache,
    ticket.queueType,
    ticket.submittedAt
  );

  // Insert and update
  const newQueue = [...queueState.mainQueue];
  newQueue.splice(insertionPoint, 0, ticketId);

  await ctx.db.patch(queueState._id, {
    mainQueue: newQueue,
    lastUpdated: Date.now(),
  });
}

async function buildQueueTypeCache(
  ctx: any,
  ticketIds: Id<"tickets">[]
): Promise<QueueTypeInfo[]> {
  const tickets = await Promise.all(
    ticketIds.map(async (id) => {
      const ticket = await ctx.db.get(id);
      return {
        ticketId: id,
        queueType: ticket!.queueType,
        submittedAt: ticket!.submittedAt,
      };
    })
  );

  return tickets;
}

function findOptimalInsertionPoint(
  queueCache: QueueTypeInfo[],
  ticketType: "priority" | "personal",
  submittedAt: number
): number {
  let priorityInCycle = 0;
  let personalInCycle = 0;

  for (let i = 0; i <= queueCache.length; i++) {
    if (ticketType === "priority") {
      if (priorityInCycle < 3) {
        // Find position in priority tickets maintaining order
        return findPositionInGroup(queueCache, i, "priority", submittedAt);
      }
    } else {
      if (priorityInCycle >= 3 && personalInCycle < 1) {
        // Find position in personal tickets maintaining order
        return findPositionInGroup(queueCache, i, "personal", submittedAt);
      }
    }

    // Update counters
    if (i < queueCache.length) {
      if (queueCache[i].queueType === "priority") {
        priorityInCycle++;
      } else {
        personalInCycle++;
      }

      // Reset cycle if complete
      if (priorityInCycle >= 3 && personalInCycle >= 1) {
        priorityInCycle = 0;
        personalInCycle = 0;
      }
    }
  }

  return queueCache.length;
}

function findPositionInGroup(
  queueCache: QueueTypeInfo[],
  startIndex: number,
  groupType: "priority" | "personal",
  submittedAt: number
): number {
  // Find the end of the current group
  let endIndex = startIndex;
  while (
    endIndex < queueCache.length &&
    queueCache[endIndex].queueType === groupType
  ) {
    endIndex++;
  }

  // Find insertion point within group maintaining order
  for (let i = startIndex; i < endIndex; i++) {
    if (queueCache[i].submittedAt > submittedAt) {
      return i;
    }
  }

  return endIndex;
}
```

### 4. Queue Position Calculation

```typescript
// convex/queueAlgorithm.ts
export async function calculateTicketPositions(
  ctx: any,
  creatorId: Id<"creators">
): Promise<TicketPosition[]> {
  const queueState = await getQueueState(ctx, creatorId);

  const positions: TicketPosition[] = queueState.mainQueue.map(
    (ticketId, index) => ({
      ticketId,
      position: index + 1,
      queueType: "", // Would need to fetch
      calculatedAt: Date.now(),
    })
  );

  return positions;
}

export async function getTicketPosition(
  ctx: any,
  ticketId: Id<"tickets">
): Promise<number | null> {
  const ticket = await ctx.db.get(ticketId);
  if (!ticket || ticket.status !== "approved") {
    return null;
  }

  const queueState = await ctx.db
    .query("queueStates")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", ticket.creatorId))
    .first();

  if (!queueState) {
    return null;
  }

  const position = queueState.mainQueue.indexOf(ticketId);
  return position >= 0 ? position + 1 : null;
}
```

### 5. Queue Maintenance

```typescript
// convex/queueAlgorithm.ts
export async function removeFromMainQueue(
  ctx: any,
  creatorId: Id<"creators">,
  ticketId: Id<"tickets">
): Promise<void> {
  const queueState = await getQueueState(ctx, creatorId);

  const ticketIndex = queueState.mainQueue.indexOf(ticketId);
  if (ticketIndex === -1) {
    return; // Ticket not in queue
  }

  // Remove ticket
  const newQueue = queueState.mainQueue.filter((id) => id !== ticketId);

  // Update queue state
  await ctx.db.patch(queueState._id, {
    mainQueue: newQueue,
    lastUpdated: Date.now(),
  });

  // Update position cache
  await updatePositionCache(ctx, queueState._id, newQueue);
}

async function updatePositionCache(
  ctx: any,
  queueStateId: Id<"queueStates">,
  queue: Id<"tickets">[]
): Promise<void> {
  // Clear existing position cache for this creator
  const existingCache = await ctx.db
    .query("ticketPositions")
    .withIndex("by_queueStateId", (q) => q.eq("queueStateId", queueStateId))
    .collect();

  for (const cache of existingCache) {
    await ctx.db.delete(cache._id);
  }

  // Create new position cache
  for (let i = 0; i < queue.length; i++) {
    await ctx.db.insert("ticketPositions", {
      ticketId: queue[i],
      queueStateId,
      position: i + 1,
      calculatedAt: Date.now(),
    });
  }
}
```

## Real-time Updates

### 1. Position Subscription

```typescript
// Client-side hook
export function useTicketPosition(ticketId: string) {
  const position = useQuery(api.queues.getTicketPosition, { ticketId });
  return position;
}
```

### 2. Queue Subscription

```typescript
// Client-side hook
export function useMainQueue(creatorId: string) {
  const queue = useQuery(api.queues.getMainQueue, { creatorId });
  return queue;
}
```

## Performance Optimizations

### 1. Efficient Queries

- Use indexed queries for queue lookups
- Cache queue type information
- Batch position calculations

### 2. Incremental Updates

- Update only affected positions
- Use efficient insertion algorithms
- Minimize database writes

### 3. Caching Strategy

- Cache position calculations
- Invalidate cache on queue changes
- Use optimistic updates

## Edge Cases

### 1. Empty Queue

- Handle initial queue building
- Graceful fallback for missing data
- Proper initialization

### 2. Single Queue Type

- Handle all-priority or all-personal queues
- Maintain ratio logic
- Preserve ordering

### 3. High Volume

- Efficient batch operations
- Pagination for large queues
- Performance monitoring

## Testing Strategy

### 1. Unit Tests

- Algorithm correctness
- Edge case handling
- Performance benchmarks

### 2. Integration Tests

- Real-time updates
- Concurrent modifications
- Data consistency

### 3. Load Tests

- High volume scenarios
- Concurrent users
- Performance under load
