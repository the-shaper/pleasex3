<!-- b245b6eb-ed14-4a08-a98a-3b963bc90e56 460fc701-45bf-49dc-a2f2-89f3e4773847 -->

# Convex Baseline as Contract-First Reference

### Why this approach

- **Yes, set up Convex now — but as a thin, contract-first baseline.** Keep the UI on mocks. This gives us a canonical schema and typed API for the dashboard to target without blocking demo progress.

### Scope (now)

- No auth, no real payments, no realtime. Just: schema, seeds, a few read queries and simple mutations that mirror our demo flows.

### Files to add/change

- `src/lib/types.ts` — shared domain types used by UI and Convex
- `src/lib/data/index.ts` — `DataProvider` interface (contract)
- `src/lib/data/mock.ts` — mock provider (used by demo)
- `src/lib/data/convex.ts` — Convex-backed provider (kept unused until swap)
- `convex/schema.ts` — Convex tables and indexes
- `convex/seed.ts` — dev-only seed with demo creator/queues/tickets
- `convex/tickets.ts` — minimal queries/mutations
- `convex/queues.ts` — queue snapshot query

### Minimal domain model

- Creators: `{ slug, displayName, minPriorityTipCents }`
- Queues: `{ creatorSlug, kind: 'personal'|'priority', activeTurn, nextTurn, etaMins, activeCount, enabled }`
- Tickets: `{ ref, creatorSlug, queueKind, tipCents, message?, status: 'open'|'approved'|'rejected'|'closed', createdAt }`

### Data contract (UI <-> data layer)

```ts
// src/lib/types.ts (essential shapes only)
export type QueueKind = "personal" | "priority";
export interface Creator {
  slug: string;
  displayName: string;
  minPriorityTipCents: number;
}
export interface QueueSnapshot {
  kind: QueueKind;
  activeTurn: number;
  nextTurn: number;
  etaMins: number;
  activeCount: number;
  enabled: boolean;
}
export interface Ticket {
  ref: string;
  creatorSlug: string;
  queueKind: QueueKind;
  tipCents: number;
  message?: string;
  status: "open" | "approved" | "rejected" | "closed";
  createdAt: number;
}
export interface DashboardOverview {
  creator: Creator;
  queues: Record<QueueKind, QueueSnapshot>;
  openTickets: Ticket[];
}
export interface CreateTicketInput {
  creatorSlug: string;
  queueKind: QueueKind;
  tipCents: number;
  message?: string;
}
export interface DataProvider {
  getDashboardOverview(creatorSlug: string): Promise<DashboardOverview>;
  getTicketByRef(ref: string): Promise<Ticket | null>;
  createTicket(input: CreateTicketInput): Promise<{ ref: string }>;
  approveTicket(ref: string): Promise<{ ok: true }>;
  rejectTicket(ref: string): Promise<{ ok: true }>;
}
```

### Convex schema (authoritative reference)

```ts
// convex/schema.ts (concise)
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
    message: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("closed")
    ),
    createdAt: v.number(),
  })
    .index("by_ref", ["ref"])
    .index("by_creator", ["creatorSlug"]),
});
```

### Minimal functions (names only)

- Queries: `queues:getSnapshot(creatorSlug)`, `tickets:getByRef(ref)`, `dashboard:getOverview(creatorSlug)`
- Mutations: `tickets:create(input)`, `tickets:approve(ref)`, `tickets:reject(ref)`

### Integration strategy

1. Keep demo pages using `MockDataProvider` (no UI change now)

2. Build Convex baseline + seed

3. Add `ConvexDataProvider`, feature-flagged via env to swap later in dashboard work

### Risks & mitigations

- Type drift → Single source of truth in `src/lib/types.ts`, runtime validation via `convex/values`
- Overbuild → Only the few queries/mutations listed above; defer everything else

### What you’ll see working

- `seed` loads demo creator/queues/tickets
- You can run queries in Convex dashboard to fetch overview and tickets
- UI stays unchanged until we flip the provider for the new dashboard

## How to flip between MockDataProvider and ConvexDataProvider

Use mocks by default for demo pages. When the dashboard work starts, you can switch to Convex in two minimal ways:

1. Env-based toggle in your module where you create the data provider

```ts
// Choose provider once per request/module
import { MockDataProvider } from "@/lib/data/mock";
import { ConvexDataProvider } from "@/lib/data/convex";

const useConvex = process.env.NEXT_PUBLIC_DATA_BACKEND === "convex";
export const dataProvider = useConvex
  ? new ConvexDataProvider()
  : new MockDataProvider();
```

2. Explicit import swap (keep it ultra-simple)

```ts
// Mock (default during demo)
import { MockDataProvider as Provider } from "@/lib/data/mock";
// For Convex, change to:
// import { ConvexDataProvider as Provider } from '@/lib/data/convex';

export const dataProvider = new Provider();
```

Required env when using Convex:

- `NEXT_PUBLIC_CONVEX_URL` — from your Convex deployment
- Optional: `NEXT_PUBLIC_DATA_BACKEND=convex` — only if using the env toggle

Notes:

- No UI changes are required; consumers call `dataProvider.getDashboardOverview(...)`, `createTicket(...)`, etc.
- Keep demo pages on mocks until the dashboard is ready to read real data.

### To-dos

- [ ] Add shared domain types in src/lib/types.ts
- [ ] Create DataProvider contract in src/lib/data/index.ts
- [ ] Implement MockDataProvider for current demo
- [ ] Add convex/schema.ts with creators, queues, tickets tables
- [ ] Create convex/seed.ts with demo data
- [ ] Add minimal queries/mutations in convex/\*.ts
- [ ] Implement ConvexDataProvider mapping to queries/mutations
- [ ] Document feature-flag swap between mock and Convex providers
