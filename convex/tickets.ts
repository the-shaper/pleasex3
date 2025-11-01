import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    const seq = Date.now();
    const ref = `${args.creatorSlug.toUpperCase()}-${seq}`;
    await ctx.db.insert("tickets", {
      ref,
      creatorSlug: args.creatorSlug,
      queueKind: args.queueKind,
      tipCents: args.tipCents,
      taskTitle: args.taskTitle,
      message: args.message,
      status: "open",
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
    if (ticket.status !== "open") return { ok: true } as const;
    await ctx.db.patch(ticket._id, { status: "approved" });
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
    if (ticket.status !== "open") return { ok: true } as const;
    await ctx.db.patch(ticket._id, { status: "rejected" });
    return { ok: true } as const;
  },
});

export const addTag = mutation({
  args: { ref: v.string(), tag: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .unique();

    if (!ticket) return { ok: false } as const;

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

    const currentTags = ticket.tags || [];
    await ctx.db.patch(ticket._id, {
      tags: currentTags.filter((t) => t !== args.tag),
    });
    return { ok: true } as const;
  },
});
