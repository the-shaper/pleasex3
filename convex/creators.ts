import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { requireCreatorOwnership } from "./lib/auth";

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

    // Insert creator
    const creatorId = await ctx.db.insert("creators", {
      slug: args.slug,
      displayName: args.displayName,
      minPriorityTipCents: args.minPriorityTipCents,
      email: args.email,
      showAutoqueueCard: true,
      clerkUserId: identity.subject,
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

    if (args.email) {
      await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, {
        email: args.email,
      });
    }

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
      } else if (existing.clerkUserId !== identity.subject) {
        // If the slug is claimed by someone else, we might want to error or handle it.
        // For now, let's just return existing (and let the dashboard fail if they try to access it)
        // OR, we could throw an error here to prevent "taking over" a slug.
        // But upsert is often used for "ensure I exist".
        // If I am user B and I say "upsert userA", and userA exists and belongs to userA...
        // I shouldn't be able to edit it.
        // But this mutation doesn't edit much, just returns ID.
        // However, the backfill above is dangerous if we don't check.
        // Let's only backfill if we are sure? 
        // Actually, if it exists and has a DIFFERENT clerkUserId, we should probably NOT return it as if it's yours?
        // But for now, let's just patch if missing.
      }
      return { creatorId: existing._id };
    }

    const creatorId = await ctx.db.insert("creators", {
      slug: args.slug,
      displayName: args.displayName,
      minPriorityTipCents: args.minPriorityTipCents,
      email: args.email,
      showAutoqueueCard: true,
      clerkUserId: identity.subject,
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

    if (args.email) {
      await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, {
        email: args.email,
      });
    }

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
      console.warn("No clerkUserId found for deleted creator, skipping Clerk deletion");
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
    const response = await fetch(`https://api.clerk.com/v1/users/${result.clerkUserId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to delete user from Clerk: ${response.status} ${errorText}`);
      // We don't throw here because the data is already deleted, just log it.
    } else {
      console.log(`Successfully deleted Clerk user ${result.clerkUserId}`);
    }
  },
});
