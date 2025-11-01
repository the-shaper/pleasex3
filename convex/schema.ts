import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  creators: defineTable({
    slug: v.string(),
    displayName: v.string(),
    minPriorityTipCents: v.number(),
  }).index("by_slug", ["slug"]),

  queues: defineTable({
    creatorSlug: v.string(),
    kind: v.union(v.literal("personal"), v.literal("priority")),
    activeTurn: v.number(),
    nextTurn: v.number(),
    etaMins: v.number(),
    activeCount: v.number(),
    enabled: v.boolean(),
  }).index("by_creator_kind", ["creatorSlug", "kind"]),

  tickets: defineTable({
    ref: v.string(),
    creatorSlug: v.string(),
    queueKind: v.union(v.literal("personal"), v.literal("priority")),
    tipCents: v.number(),
    taskTitle: v.optional(v.string()),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("closed")
    ),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    // Add new user contact fields
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    social: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    consentEmail: v.optional(v.boolean()),
  })
    .index("by_ref", ["ref"])
    .index("by_creator", ["creatorSlug"]),
});
