import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  creators: defineTable({
    slug: v.string(),
    displayName: v.string(),
    minPriorityTipCents: v.number(),
    email: v.optional(v.string()),
    showAutoqueueCard: v.optional(v.boolean()),
    // Stripe / payouts integration
    stripeAccountId: v.optional(v.string()),
    payoutEnabled: v.optional(v.boolean()),
    clerkUserId: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_clerk_user", ["clerkUserId"]),

  queues: defineTable({
    creatorSlug: v.string(),
    kind: v.union(v.literal("personal"), v.literal("priority")),
    activeTurn: v.number(),
    nextTurn: v.number(),
    etaDays: v.number(),
    activeCount: v.number(),
    enabled: v.boolean(),
    avgDaysPerTicket: v.optional(v.number()),
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
      v.literal("closed"),
      v.literal("pending_payment")
    ),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    // User contact fields
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    social: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    consentEmail: v.optional(v.boolean()),
    // Engine-assigned numbers (optional)
    ticketNumber: v.optional(v.number()),
    queueNumber: v.optional(v.number()),
    // Payment status tracking (v3)
    paymentIntentId: v.optional(v.string()),
    paymentStatus: v.optional(
      v.union(
        v.literal("requires_capture"),
        v.literal("succeeded"),
        v.literal("canceled"),
        v.literal("refunded"),
        v.literal("pending")
      )
    ),
    resolvedAt: v.optional(v.number()),
    // Rejection tracking
    rejectionReason: v.optional(
      v.union(v.literal("creator_rejected"), v.literal("expired"))
    ),
    // Reminder tracking (to avoid spamming creators)
    reminderSentAt: v.optional(v.number()),
  })
    .index("by_ref", ["ref"])
    .index("by_creator", ["creatorSlug"]),

  // Monotonic counters per creator for safe ticket numbering
  counters: defineTable({
    creatorSlug: v.string(),
    nextTicketNumber: v.number(),
    nextPersonalNumber: v.number(),
    nextPriorityNumber: v.number(),
  }).index("by_creator", ["creatorSlug"]),

  // Payment records attributed to creators (Stripe and future providers)
  payments: defineTable({
    creatorSlug: v.string(),
    amountGross: v.number(), // in cents
    currency: v.string(),
    status: v.string(), // e.g. "succeeded", "refunded"
    provider: v.string(), // e.g. "stripe"
    externalId: v.string(), // e.g. Stripe payment_intent id
    ticketRef: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_creator", ["creatorSlug"])
    .index("by_creator_createdAt", ["creatorSlug", "createdAt"])
    .index("by_externalId", ["externalId"]),

  // Payout records per creator per period
  payouts: defineTable({
    creatorSlug: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    grossCents: v.number(),
    platformFeeCents: v.number(),
    payoutCents: v.number(),
    currency: v.string(),
    stripeTransferId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("paid"),
      v.literal("failed")
    ),
    createdAt: v.number(),
  })
    .index("by_creator_period", ["creatorSlug", "periodStart", "periodEnd"])
    .index("by_creator_createdAt", ["creatorSlug", "createdAt"]),
});
