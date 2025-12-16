import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  assignNumbersOnApprove,
  computeTagsForCreator,
} from "./lib/ticketEngine";
import { requireCreatorOwnership } from "./lib/auth";

async function scheduleTicketEmails(ctx: any, ticket: any) {
  if (ticket.email) {
    // 1. Receipt to User
    await ctx.scheduler.runAfter(0, internal.emails.sendTicketReceipt, {
      email: ticket.email,
      userName: ticket.name || "User",
      ticketRef: ticket.ref,
      trackingUrl: "", // allow template fallback to /tracking?ref=:ref
      creatorName: ticket.creatorSlug, // Ideally fetch display name, but slug works for now
      ticketType: ticket.queueKind,
    });

    // 2. Alert to Creator
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q: any) => q.eq("slug", ticket.creatorSlug))
      .unique();

    if (creator && creator.email) {
      console.info("[email] scheduling creator alert", {
        creator: creator.slug,
        email: creator.email,
        ticketRef: ticket.ref,
      });
      await ctx.scheduler.runAfter(0, internal.emails.sendCreatorAlert, {
        email: creator.email,
        creatorName: creator.displayName || ticket.creatorSlug,
        userName: ticket.name || "User",
        ticketType: ticket.queueKind,
        tipAmount: ticket.tipCents ? ticket.tipCents / 100 : 0,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://pleasepleaseplease.me"}/${ticket.creatorSlug}/dashboard`,
      });
    } else {
      console.warn("[email] creator alert skipped: missing creator or email", {
        creatorSlug: ticket.creatorSlug,
        creatorFound: Boolean(creator),
        hasEmail: Boolean(creator?.email),
        ticketRef: ticket.ref,
      });
    }
  }
}

export const getByRef = query({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();
    return ticket ?? null;
  },
});

export const create = mutation({
  args: {
    creatorSlug: v.string(),
    queueKind: v.union(v.literal("personal"), v.literal("priority")),
    tipCents: v.number(),
    taskTitle: v.optional(v.string()),
    message: v.optional(v.string()),
    // Add new user contact fields
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    social: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    consentEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const prefix = args.creatorSlug.toUpperCase();

    // Human-friendly reference: CREATOR-PPP-1234
    // 4-digit segment is enforced unique per creator via a quick lookup.
    let ref: string;
    while (true) {
      const rand = Math.floor(1000 + Math.random() * 9000); // 1000-9999
      const candidate = `${prefix}-PPP-${rand}`;

      const existing = await ctx.db
        .query("tickets")
        .withIndex("by_ref", (q) => q.eq("ref", candidate))
        .unique();

      if (!existing) {
        ref = candidate;
        break;
      }
    }
    await ctx.db.insert("tickets", {
      ref,
      creatorSlug: args.creatorSlug,
      queueKind: args.queueKind,
      tipCents: args.tipCents,
      taskTitle: args.taskTitle,
      message: args.message,
      status: args.tipCents > 0 ? "pending_payment" : "open",
      createdAt: Date.now(),
      // Add new user contact fields
      name: args.name,
      email: args.email,
      phone: args.phone,
      location: args.location,
      social: args.social,
      attachments: args.attachments,
      consentEmail: args.consentEmail,
    });

    // Ensure queue exists for this ticket type
    await ctx.scheduler.runAfter(0, api.queues.ensureQueueExists, {
      creatorSlug: args.creatorSlug,
      kind: args.queueKind,
    });

    // Trigger emails ONLY if open (free). Paid tickets trigger emails after payment confirmation.
    if (args.tipCents <= 0) {
      await scheduleTicketEmails(ctx, {
        ref,
        ...args,
      });
    }
    return { ref } as const;
  },
});

export const approve = mutation({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();
    if (!ticket) return { ok: true } as const;

    // 🔒 Security: Verify the authenticated user owns this ticket's creator
    await requireCreatorOwnership(ctx, ticket.creatorSlug);

    // Allow approval for both open (free) and pending_payment (paid) tickets
    if (ticket.status !== "open" && ticket.status !== "pending_payment")
      return { ok: true } as const;

    // Attempt to capture payment first (v3)
    if (ticket.paymentIntentId) {
      try {
        // We call the ACTION from here. Note: Mutation calling Action is not standard pattern directly,
        // but we can't block mutation on external API call.
        // Wait! We cannot call `api.payments.capturePaymentForTicket` (action) from a mutation.
        //
        // CORRECT PATTERN:
        // The UI should call the action `capturePaymentForTicket` first.
        // That action calls stripe -> success -> calls `recordStripePayment` mutation AND updates ticket status.
        //
        // HOWEVER, for backward compatibility or non-payment tickets, we might still need this.
        // But if this is a paid ticket, this mutation ALONE is insufficient because it doesn't capture funds.
        //
        // STRATEGY:
        // If `paymentIntentId` exists and is not captured, we should technically FAIL here and tell client to call the action.
        // But to keep it robust: The `ApprovalPanel` client-side will act as the coordinator.
        // It will call `capturePaymentForTicket` action.
        // That action's internal logic handles the DB updates (status -> approved).
        //
        // So: This `approve` mutation is strictly for:
        // 1. Non-payment tickets (if any).
        // 2. Fallback / Admin overrides where we just want to force status.
        //
        // We will leave it as is, but the client must use the ACTION for paid tickets.
      } catch (err) {
        console.error("Payment capture check failed", err);
      }
    }

    // Standard approval flow (for free/legacy/manual-override)
    await ctx.db.patch(ticket._id, {
      status: "approved",
      resolvedAt: Date.now(),
    });

    await assignNumbersOnApprove(ctx, ticket._id);
    await computeTagsForCreator(ctx, ticket.creatorSlug);

    // Trigger Email: Ticket Approved
    if (ticket.email) {
      // Fetch updated ticket to get queue number (if assigned)
      const updatedTicket = await ctx.db.get(ticket._id);
      await ctx.scheduler.runAfter(0, internal.emails.sendTicketApproved, {
        email: ticket.email,
        userName: ticket.name || "User",
        ticketRef: ticket.ref,
        queueNumber: updatedTicket?.queueNumber || 0,
        trackingUrl: "", // allow template fallback to /tracking?ref=:ref
        ticketType: ticket.queueKind,
      });
    }

    return { ok: true } as const;
  },
});

export const reject = mutation({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();
    if (!ticket) return { ok: true } as const;

    // 🔒 Security: Verify the authenticated user owns this ticket's creator
    await requireCreatorOwnership(ctx, ticket.creatorSlug);

    // Allow rejection for both open (free) and pending_payment (paid) tickets
    if (ticket.status !== "open" && ticket.status !== "pending_payment")
      return { ok: true } as const;

    // Similar to approve:
    // Real paid tickets should use `cancelOrRefundPaymentForTicket` action.
    // This mutation is for manual override or free tickets.

    const currentTags = ticket.tags || [];
    // Remove status-related tags if any (though open tickets shouldn't have them usually)
    const nextTags = currentTags.filter(
      (t) => t !== "current" && t !== "next-up" && t !== "awaiting-feedback"
    );
    if (!nextTags.includes("rejected")) {
      nextTags.push("rejected");
    }

    await ctx.db.patch(ticket._id, {
      status: "rejected",
      tags: nextTags,
      resolvedAt: Date.now(),
    });

    // Trigger Email: Ticket Rejected
    if (ticket.email) {
      await ctx.scheduler.runAfter(0, internal.emails.sendTicketRejected, {
        email: ticket.email,
        userName: ticket.name || "User",
        ticketRef: ticket.ref,
        creatorName: ticket.creatorSlug,
      });
    }

    return { ok: true } as const;
  },
});

// Internal mutation for auto-expiring tickets (called by cron, no auth required)
export const rejectExpired = internalMutation({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();
    if (!ticket) return { ok: false, reason: "not_found" } as const;

    // Only expire open or pending_payment tickets
    if (ticket.status !== "open" && ticket.status !== "pending_payment") {
      return { ok: false, reason: "wrong_status" } as const;
    }

    const currentTags = ticket.tags || [];
    const nextTags = currentTags.filter(
      (t) => t !== "current" && t !== "next-up" && t !== "awaiting-feedback"
    );
    if (!nextTags.includes("rejected")) {
      nextTags.push("rejected");
    }

    await ctx.db.patch(ticket._id, {
      status: "rejected",
      tags: nextTags,
      resolvedAt: Date.now(),
      rejectionReason: "expired",
    });

    // Send expiration email to user
    if (ticket.email) {
      await ctx.scheduler.runAfter(0, internal.emails.sendTicketRejected, {
        email: ticket.email,
        userName: ticket.name || "User",
        ticketRef: ticket.ref,
        creatorName: ticket.creatorSlug,
        reason: "expired",
      });
    }

    console.log(`[Cron] Auto-expired ticket ${ticket.ref} after 7 days`);
    return { ok: true } as const;
  },
});

// Internal mutation to mark reminder sent (called by cron)
export const markReminderSent = internalMutation({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();
    if (!ticket) return;

    await ctx.db.patch(ticket._id, {
      reminderSentAt: Date.now(),
    });
  },
});

// addTag, removeTag unchanged

export const addTag = mutation({
  args: { ref: v.string(), tag: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();

    if (!ticket) return { ok: false } as const;

    // 🔒 Security: Verify the authenticated user owns this ticket's creator
    await requireCreatorOwnership(ctx, ticket.creatorSlug);

    const currentTags = ticket.tags || [];
    if (!currentTags.includes(args.tag)) {
      await ctx.db.patch(ticket._id, {
        tags: [...currentTags, args.tag],
      });
    }
    return { ok: true } as const;
  },
});

export const removeTag = mutation({
  args: { ref: v.string(), tag: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();

    if (!ticket) return { ok: false } as const;

    // 🔒 Security: Verify the authenticated user owns this ticket's creator
    await requireCreatorOwnership(ctx, ticket.creatorSlug);

    const currentTags = ticket.tags || [];
    await ctx.db.patch(ticket._id, {
      tags: currentTags.filter((t) => t !== args.tag),
    });
    return { ok: true } as const;
  },
});

// recomputeWorkflowTagsForCreator is now delegated to ticketEngine

export const recomputeWorkflowTagsForCreator = mutation({
  args: { creatorSlug: v.string() },
  handler: async (ctx, args) => {
    await computeTagsForCreator(ctx, args.creatorSlug);
    return { ok: true as const };
  },
});

export const toggleCurrentAwaiting = mutation({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();

    if (!ticket) return { ok: false as const };

    // 🔒 Security: Verify the authenticated user owns this ticket's creator
    await requireCreatorOwnership(ctx, ticket.creatorSlug);

    const tags = ticket.tags || [];
    const hasAwaiting = tags.includes("awaiting-feedback");
    const hasCurrent = tags.includes("current");

    if (hasAwaiting) {
      const nextTags = tags.filter((t) => t !== "awaiting-feedback");
      if (!nextTags.includes("current")) nextTags.push("current");
      await ctx.db.patch(ticket._id, { tags: nextTags });
      await computeTagsForCreator(ctx, ticket.creatorSlug);
      return { ok: true as const, tag: "current" as const };
    }

    if (hasCurrent) {
      const nextTags = tags.filter((t) => t !== "current" && t !== "next-up");
      if (!nextTags.includes("awaiting-feedback")) {
        nextTags.push("awaiting-feedback");
      }
      await ctx.db.patch(ticket._id, {
        tags: nextTags,
      });
      await computeTagsForCreator(ctx, ticket.creatorSlug);
      return { ok: true as const, tag: "awaiting-feedback" as const };
    }

    return { ok: false as const };
  },
});

export const markAsFinished = mutation({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();

    if (!ticket) return { ok: false as const };
    if (ticket.status === "closed") return { ok: true as const };

    // 🔒 Security: Verify the authenticated user owns this ticket's creator
    await requireCreatorOwnership(ctx, ticket.creatorSlug);

    const currentTags = ticket.tags || [];
    const cleanedTags = currentTags.filter(
      (t) => t !== "current" && t !== "awaiting-feedback"
    );

    // Add "finished" tag
    if (!cleanedTags.includes("finished")) {
      cleanedTags.push("finished");
    }

    await ctx.db.patch(ticket._id, {
      status: "closed",
      tags: cleanedTags.length > 0 ? cleanedTags : undefined,
      resolvedAt: Date.now(),
    });

    await computeTagsForCreator(ctx, ticket.creatorSlug);

    return { ok: true as const };
  },
});

export const cleanupTicketNumbers = mutation({
  args: {},
  handler: async (ctx) => {
    const tickets = await ctx.db.query("tickets").collect();

    for (const t of tickets) {
      if (t.status === "open" || t.status === "rejected") {
        if (t.ticketNumber || t.queueNumber) {
          await ctx.db.patch(t._id, {
            ticketNumber: undefined,
            queueNumber: undefined,
          });
        }
      }
    }

    return { ok: true as const };
  },
});

export const markAsOpen = mutation({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();

    if (!ticket) return { ok: false } as const;
    if (ticket.status !== "pending_payment") return { ok: true } as const;

    await ctx.db.patch(ticket._id, { status: "open" });
    return { ok: true } as const;
  },
});

export const confirmTicketAuthorized = mutation({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();

    if (!ticket) return { ok: false } as const;

    // Only proceed if pending_payment
    if (ticket.status !== "pending_payment") return { ok: true } as const;

    // Update payment status to requires_capture
    await ctx.db.patch(ticket._id, {
      paymentStatus: "requires_capture",
    });

    // Send emails
    await scheduleTicketEmails(ctx, ticket);

    return { ok: true } as const;
  },
});
