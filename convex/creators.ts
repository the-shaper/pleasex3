import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { requireCreatorOwnership } from "./lib/auth";

// Shared helper for initializing a creator and their queues/tickets
async function initializeCreator(
  ctx: any,
  args: {
    slug: string;
    displayName: string;
    minPriorityTipCents: number;
    email?: string;
    identityEmail?: string;
    clerkUserId: string;
  }
) {
  const creatorEmail = args.email ?? args.identityEmail;

  // Insert creator
  const creatorId = await ctx.db.insert("creators", {
    slug: args.slug,
    displayName: args.displayName,
    minPriorityTipCents: args.minPriorityTipCents,
    email: creatorEmail,
    showAutoqueueCard: true,
    clerkUserId: args.clerkUserId,
  });

  // Insert personal queue (enabled by default)
  await ctx.db.insert("queues", {
    creatorSlug: args.slug,
    kind: "personal",
    activeTurn: 0,
    nextTurn: 1,
    etaDays: 0,
    activeCount: 0,
    enabled: true,
    avgDaysPerTicket: 1,
  });

  // Insert priority queue (enabled by default)
  await ctx.db.insert("queues", {
    creatorSlug: args.slug,
    kind: "priority",
    activeTurn: 0,
    nextTurn: 1,
    etaDays: 0,
    activeCount: 0,
    enabled: false,
    avgDaysPerTicket: 1,
  });

  // Create Onboarding Ticket
  const prefix = args.slug.toUpperCase();
  let ref: string;
  // Simple retry loop for uniqueness (same as in tickets.ts)
  while (true) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${prefix}-PPP-${rand}`;
    const existing = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q: any) => q.eq("ref", candidate))
      .unique();
    if (!existing) {
      ref = candidate;
      break;
    }
  }

  await ctx.db.insert("tickets", {
    ref,
    creatorSlug: args.slug,
    queueKind: "personal",
    tipCents: 0,
    taskTitle: "Get around this app",
    message: `You have three important things to know. 

1.  YOU CAN APPROVE OR REJECT TICKET REQUESTS LIKE THIS ONE. Click the "Approve" button at the bottom of this ticket to approve it. Once approved, the ticket will move to the "NEXT UP" section. (If you reject, go check the "ALL" tab to see it again. Please note that once you reject a ticket, you can't approve it again.) 

2.  TO MANAGE YOUR QUEUES (PERSONAL AND PRIORITY) GO TO THE "QUEUE SETTINGS" TAB. Please note that you can only enable the Priority queue if your stripe account is connected.

3.  TO GET PAID, YOU NEED TO CONNECT STRIPE. Go to the "EARNINGS" tab to connect your stripe account. 


There are more features to this app, but these are the essentials.`,
    status: "open",
    createdAt: Date.now(),
    name: "PLEASE PLEASE PLEASE!",
    email: "create@twilightfringe.com",
    location: "Ensenada, Mexico",
    attachments: [`https://pleasepleaseplease.me/${args.slug}`],
  });

  if (args.email) {
    await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, {
      email: args.email,
    });
  }

  return creatorId;
}

export const create = mutation({
  args: {
    slug: v.string(),
    displayName: v.string(),
    minPriorityTipCents: v.number(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const creatorId = await initializeCreator(ctx, {
      ...args,
      identityEmail: identity.email,
      clerkUserId: identity.subject,
    });

    return { success: true, creatorId };
  },
});

export const upsertBySlug = mutation({
  args: {
    slug: v.string(),
    displayName: v.string(),
    minPriorityTipCents: v.number(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      // Backfill clerkUserId if missing
      if (!existing.clerkUserId) {
        await ctx.db.patch(existing._id, { clerkUserId: identity.subject });
      }
      // Backfill email if missing
      if (!existing.email && identity.email) {
        await ctx.db.patch(existing._id, { email: identity.email });
      }
      return { creatorId: existing._id };
    }

    const creatorId = await initializeCreator(ctx, {
      ...args,
      identityEmail: identity.email,
      clerkUserId: identity.subject,
    });

    return { creatorId };
  },
});

export const updateMinPriorityFee = mutation({
  args: {
    slug: v.string(),
    minPriorityTipCents: v.number(),
  },
  handler: async (ctx, args) => {
    // 🔒 Security: Verify the authenticated user owns this creator
    const creator = await requireCreatorOwnership(ctx, args.slug);

    if (!creator) {
      throw new Error("Creator not found");
    }

    await ctx.db.patch(creator._id, {
      minPriorityTipCents: args.minPriorityTipCents,
    });

    return { success: true };
  },
});

export const deleteCreator = mutation({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    // 🔒 Security: Verify the authenticated user owns this creator
    const creator = await requireCreatorOwnership(ctx, args.slug);

    if (!creator) {
      throw new Error("Creator not found");
    }

    // 1. Delete associated queues (personal and priority)
    const personalQueue = await ctx.db
      .query("queues")
      .withIndex("by_creator_kind", (q) =>
        q.eq("creatorSlug", args.slug).eq("kind", "personal")
      )
      .unique();

    if (personalQueue) await ctx.db.delete(personalQueue._id);

    const priorityQueue = await ctx.db
      .query("queues")
      .withIndex("by_creator_kind", (q) =>
        q.eq("creatorSlug", args.slug).eq("kind", "priority")
      )
      .unique();

    if (priorityQueue) await ctx.db.delete(priorityQueue._id);

    // 3. Delete associated tickets
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_creator", (q) => q.eq("creatorSlug", args.slug))
      .collect();

    for (const ticket of tickets) {
      await ctx.db.delete(ticket._id);
    }

    // 4. Delete counters
    const counters = await ctx.db
      .query("counters")
      .withIndex("by_creator", (q) => q.eq("creatorSlug", args.slug))
      .collect();

    for (const counter of counters) {
      await ctx.db.delete(counter._id);
    }

    // 5. Delete payments (optional, but good for cleanup)
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_creator", (q) => q.eq("creatorSlug", args.slug))
      .collect();

    for (const payment of payments) {
      await ctx.db.delete(payment._id);
    }

    // 6. Delete the creator record
    await ctx.db.delete(creator._id);

    return { success: true, clerkUserId: creator.clerkUserId };
  },
});

export const deleteAccountAction = action({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Call mutation to delete data
    const result = await ctx.runMutation(api.creators.deleteCreator, {
      slug: args.slug,
    });

    if (!result.clerkUserId) {
      console.warn(
        "No clerkUserId found for deleted creator, skipping Clerk deletion"
      );
      return;
    }

    // 2. Delete user from Clerk
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      console.error("CLERK_SECRET_KEY not set, cannot delete user from Clerk");
      return;
    }

    // Assuming standard Clerk Backend API URL or derived from environment
    // We'll use the standard API endpoint
    const response = await fetch(
      `https://api.clerk.com/v1/users/${result.clerkUserId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to delete user from Clerk: ${response.status} ${errorText}`
      );
      // We don't throw here because the data is already deleted, just log it.
    } else {
      console.log(`Successfully deleted Clerk user ${result.clerkUserId}`);
    }
  },
});
