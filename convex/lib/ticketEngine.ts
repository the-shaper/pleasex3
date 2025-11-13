import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";

export type QueueKind = "personal" | "priority";
export type TicketStatus = "open" | "approved" | "rejected" | "closed";
export type TicketTag = "current" | "next-up" | "pending" | "awaiting-feedback";

export interface TicketDoc {
  _id: string;
  ref: string;
  creatorSlug: string;
  queueKind: QueueKind;
  status: TicketStatus;
  createdAt: number;
  ticketNumber?: number;
  queueNumber?: number;
  // Persisted tags are arbitrary strings; engine-specific tags are a subset.
  tags?: string[];
}

export interface TicketPosition {
  ref: string;
  queueKind: QueueKind;
  status: TicketStatus;
  ticketNumber?: number;
  queueNumber?: number;
  tag?: TicketTag;
  activeBeforeYou?: number;
}

export interface QueueMetrics {
  enabled: boolean;
  activeCount: number;
  currentTicketNumber?: number;
  nextTicketNumber?: number;
  etaMins?: number | null;
}

export interface QueueSnapshot {
  personal: QueueMetrics;
  priority: QueueMetrics;
  general: QueueMetrics;
}

export interface SchedulePattern {
  priority: number;
  personal: number;
}

const DEFAULT_PATTERN: SchedulePattern = { priority: 3, personal: 1 };

function isAwaitingFeedback(tags?: TicketTag[] | string[] | null): boolean {
  if (!tags) return false;
  return (tags as string[]).includes("awaiting-feedback");
}

function getTag(tags?: TicketTag[] | string[] | null): TicketTag | undefined {
  if (!tags || !tags.length) return undefined;
  const asStrings = tags as string[];
  const priority: TicketTag[] = ["current", "next-up", "awaiting-feedback"];
  const found = asStrings.find((t) => priority.includes(t as TicketTag));
  return (found as TicketTag) ?? (asStrings[0] as TicketTag | undefined);
}

function sortByCreatedAt(a: TicketDoc, b: TicketDoc): number {
  return a.createdAt - b.createdAt;
}

export async function getAllTicketsForCreator(
  ctx: QueryCtx,
  creatorSlug: string
): Promise<TicketDoc[]> {
  const tickets = await ctx.db
    .query("tickets")
    .withIndex("by_creator", (q) => q.eq("creatorSlug", creatorSlug))
    .collect();

  return tickets.map((t: any) => ({
    _id: t._id,
    ref: t.ref,
    creatorSlug: t.creatorSlug,
    queueKind: t.queueKind,
    status: t.status,
    createdAt: t.createdAt,
    ticketNumber: t.ticketNumber,
    queueNumber: t.queueNumber,
    tags: t.tags,
  }));
}

export async function assignNumbersOnApprove(
  ctx: MutationCtx,
  ticketId: string
): Promise<void> {
  const ticket = (await ctx.db.get(ticketId as any)) as any;
  if (!ticket || ticket.status !== "approved") return;

  if (typeof ticket.ticketNumber === "number") return;

  const creatorSlug = ticket.creatorSlug as string;
  const queueKind = ticket.queueKind as QueueKind;

  // Use per-creator counters to ensure monotonic numbering.
  let counter = await ctx.db
    .query("counters")
    .withIndex("by_creator", (q) => q.eq("creatorSlug", creatorSlug))
    .unique();

  if (!counter) {
    const id = await ctx.db.insert("counters", {
      creatorSlug,
      nextTicketNumber: 1,
      nextPersonalNumber: 1,
      nextPriorityNumber: 1,
    });
    // Narrow explicitly to the counters table type
    counter = (await ctx.db.get(id)) as any;
  }

  if (!counter) return; // defensive

  const nextTicketNumber = counter.nextTicketNumber as number;
  const nextPersonalNumber = counter.nextPersonalNumber as number;
  const nextPriorityNumber = counter.nextPriorityNumber as number;

  const ticketNumber = nextTicketNumber;
  const queueNumber =
    queueKind === "personal" ? nextPersonalNumber : nextPriorityNumber;

  // Patch ticket with assigned numbers
  await ctx.db.patch(ticket._id, { ticketNumber, queueNumber });

  // Increment counters for next time
  await ctx.db.patch(counter._id as any, {
    nextTicketNumber: nextTicketNumber + 1,
    ...(queueKind === "personal"
      ? { nextPersonalNumber: nextPersonalNumber + 1 }
      : { nextPriorityNumber: nextPriorityNumber + 1 }),
  });
}

export function computeSchedule(
  tickets: TicketDoc[],
  pattern: SchedulePattern = DEFAULT_PATTERN
): TicketDoc[] {
  const active = tickets.filter((t) => {
    if (t.status !== "approved") return false;
    // DON'T filter out awaiting-feedback - keep them in schedule
    return true;
  });

  // Separate awaiting-feedback for special handling
  const awaitingFeedback = active.filter((t) => isAwaitingFeedback(t.tags));
  const regularActive = active.filter((t) => !isAwaitingFeedback(t.tags));
  
  const current = regularActive.find((t) => t.tags?.includes("current"));
  const remaining = regularActive.filter((t) => t._id !== current?._id);

  const priorityTickets = remaining
    .filter((t) => t.queueKind === "priority")
    .sort(sortByCreatedAt);

  const personalTickets = remaining
    .filter((t) => t.queueKind === "personal")
    .sort(sortByCreatedAt);

  const ordered: TicketDoc[] = [];
  
  // Start with current ticket
  if (current) ordered.push(current);
  
  // Add awaiting-feedback tickets next (maintain their order)
  if (awaitingFeedback.length > 0) {
    ordered.push(...awaitingFeedback.sort(sortByCreatedAt));
  }
  
  // Continue with 3:1 pattern for remaining tickets
  let pIdx = 0;
  let perIdx = 0;

  while (
    pIdx < priorityTickets.length ||
    perIdx < personalTickets.length
  ) {
    for (
      let i = 0;
      i < pattern.priority && pIdx < priorityTickets.length;
      i++
    ) {
      ordered.push(priorityTickets[pIdx++]);
}

    for (
      let i = 0;
      i < pattern.personal && perIdx < personalTickets.length;
      i++
    ) {
      ordered.push(personalTickets[perIdx++]);
    }
  }

  return ordered;
}

export function computeTagsForSchedule(ordered: TicketDoc[]): TicketPosition[] {
  const positions: TicketPosition[] = [];

  ordered.forEach((ticket, index) => {
    let tag: TicketTag | undefined = getTag(ticket.tags);

    // Preserve awaiting-feedback state - don't reassign based on position
    if (tag === "awaiting-feedback") {
      // Keep awaiting-feedback, don't reassign based on position
    } else {
      // Count only non-awaiting-feedback tickets for position-based tagging
      let activeIndex = 0;
      for (let i = 0; i < index; i++) {
        const prevTag = getTag(ordered[i].tags);
        if (prevTag !== "awaiting-feedback") {
          activeIndex++;
        }
      }

      if (activeIndex === 0) {
        tag = "current";
      } else if (activeIndex === 1) {
        tag = "next-up";
      } else if (!tag || tag === "current" || tag === "next-up") {
        tag = "pending";
      }
    }

    positions.push({
      ref: ticket.ref,
      queueKind: ticket.queueKind,
      status: ticket.status,
      ticketNumber: ticket.ticketNumber,
      queueNumber: ticket.queueNumber,
      tag,
      activeBeforeYou: index,
    });
  });

  return positions;
}

export async function computeTagsForCreator(
  ctx: MutationCtx,
  creatorSlug: string,
  pattern: SchedulePattern = DEFAULT_PATTERN
): Promise<void> {
  const tickets = await getAllTicketsForCreator(ctx as any, creatorSlug);
  const ordered = computeSchedule(tickets, pattern);
  const positions = computeTagsForSchedule(ordered);

  const map = new Map(positions.map((p) => [p.ref, p.tag]));
  const engineTags: TicketTag[] = [
    "current",
    "next-up",
    "pending",
    "awaiting-feedback",
  ];

  for (const t of tickets) {
    const nextTag = map.get(t.ref);
    const currentAwaitingFeedback = t.tags?.includes("awaiting-feedback");
    
    // Preserve awaiting-feedback state - don't overwrite if already set
    if (currentAwaitingFeedback && nextTag !== "awaiting-feedback") {
      // Skip updating this ticket - keep its awaiting-feedback tag
      console.log("[computeTagsForCreator] preserving awaiting-feedback for", t.ref);
      continue;
    }

    // Strip all engine-controlled tags; keep only non-engine tags.
    const baseTags = (t.tags || []).filter(
      (tag) => !engineTags.includes(tag as TicketTag)
    );

    const tags = nextTag ? [...baseTags, nextTag] : baseTags;

    console.log("[computeTagsForCreator] updating", t.ref, {
      currentTags: t.tags,
      nextTag,
      finalTags: tags
    });

    await ctx.db.patch(t._id as any, {
      tags: tags.length ? (tags as any) : undefined,
    });
  }
}

export async function getQueueSnapshot(
  ctx: QueryCtx,
  creatorSlug: string,
  pattern: SchedulePattern = DEFAULT_PATTERN
): Promise<QueueSnapshot> {
  const tickets = await getAllTicketsForCreator(ctx, creatorSlug);
  const ordered = computeSchedule(tickets, pattern);

  const active = ordered;

  // Debug: log ordered schedule for this creator
  console.log("[ticketEngine] getQueueSnapshot ordered", creatorSlug, {
    ordered: active.map((t) => ({
      ref: t.ref,
      queueKind: t.queueKind,
      status: t.status,
      ticketNumber: t.ticketNumber,
      queueNumber: t.queueNumber,
      tags: t.tags,
    })),
  });

  const buildMetrics = (
    filter?: (t: TicketDoc) => boolean,
    useQueueNumber = false
  ): QueueMetrics => {
    const subset = filter ? active.filter(filter) : active;
    const activeCount = subset.length;

    const currentBase = subset[0];
    const nextBase = subset[1];

    const currentTicketNumber = useQueueNumber
      ? currentBase?.queueNumber
      : currentBase?.ticketNumber;
    const nextTicketNumber = useQueueNumber
      ? nextBase?.queueNumber
      : nextBase?.ticketNumber;

    const etaMins = activeCount > 0 ? activeCount * 5 : null;

    const metrics: QueueMetrics = {
      enabled: true,
      activeCount,
      currentTicketNumber,
      nextTicketNumber,
      etaMins,
    };

    console.log("[ticketEngine] getQueueSnapshot metrics", creatorSlug, {
      scope: filter ? (useQueueNumber ? "per-queue" : "filtered") : "general",
      metrics,
    });

    return metrics;
  };

  return {
    // For per-queue cards, use queueNumber so "Current Turn" is queue-specific.
    personal: buildMetrics((t) => t.queueKind === "personal", true),
    priority: buildMetrics((t) => t.queueKind === "priority", true),
    // For general, keep using global ticketNumber.
    general: buildMetrics(),
  };
}

export async function getTicketPositions(
  ctx: QueryCtx,
  creatorSlug: string,
  pattern: SchedulePattern = DEFAULT_PATTERN
): Promise<TicketPosition[]> {
  const tickets = await getAllTicketsForCreator(ctx, creatorSlug);
  
  // Return ALL tickets with basic positions (not just active ones)
  // This allows PAST/ALL tabs to see closed/rejected tickets
  return tickets.map((ticket, index) => {
    let tag: TicketTag | undefined = getTag(ticket.tags);
    
    // Only compute tags for approved tickets that participate in scheduling
    if (ticket.status !== "approved") {
      tag = undefined;
    }
    
    return {
      ref: ticket.ref,
      queueKind: ticket.queueKind,
      status: ticket.status,
      ticketNumber: ticket.ticketNumber,
      queueNumber: ticket.queueNumber,
      tag,
      activeBeforeYou: index,
    };
  });
}

export async function getActiveTicketPositions(
  ctx: QueryCtx,
  creatorSlug: string,
  pattern: SchedulePattern = DEFAULT_PATTERN
): Promise<TicketPosition[]> {
  const tickets = await getAllTicketsForCreator(ctx, creatorSlug);
  const ordered = computeSchedule(tickets, pattern);
  return computeTagsForSchedule(ordered);
}



export async function getTicketPosition(
  ctx: QueryCtx,
  ref: string,
  creatorSlug: string,
  pattern: SchedulePattern = DEFAULT_PATTERN
): Promise<TicketPosition | null> {
  const positions = await getTicketPositions(ctx, creatorSlug, pattern);
  return positions.find((p) => p.ref === ref) ?? null;
}

export async function getNextTicketNumbersForCreator(
  ctx: QueryCtx,
  creatorSlug: string
): Promise<{
  nextTicketNumber: number;
  nextPersonalNumber: number;
  nextPriorityNumber: number;
}> {
  const counter = await ctx.db
    .query("counters")
    .withIndex("by_creator", (q) => q.eq("creatorSlug", creatorSlug))
    .unique();

  if (!counter) {
    return {
      nextTicketNumber: 1,
      nextPersonalNumber: 1,
      nextPriorityNumber: 1,
    };
  }

  return {
    nextTicketNumber: counter.nextTicketNumber as number,
    nextPersonalNumber: counter.nextPersonalNumber as number,
    nextPriorityNumber: counter.nextPriorityNumber as number,
  };
}
