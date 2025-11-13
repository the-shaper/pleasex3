# Convex Ticket Engine Roadmap (v1)

## Why We’re Here

- Today, multiple surfaces (landing, submit, success, dashboard, Storybook mocks) each recalculate queue order and numbers differently.
- Mature queue systems (see SEDCO’s banking guide: https://www.sedco.co/en/blogs/queue-management-system-banks-complete-guide) use a single engine that assigns numbers once, applies routing rules centrally, and pushes consistent data to all displays.
- We want the same: one Convex module that owns numbering, 3:1 scheduling, tags, and queue metrics; all clients become “dumb UIs” that just render engine output.

## Core Principles

1. Single source of truth
   - All queue math (ordering, tags, positions, metrics) lives in Convex.
   - No UI or API route recomputes 3:1 order or manually derives `current` / `next-up`.

2. Static numbers, dynamic positions
   - Tickets receive stable identifiers when they enter the real queue (on approval):
     - `ticketNumber`: global, monotonic sequence per creator (what you’d print on a ticket display).
     - `queueNumber`: per-queue (personal or priority) sequence.
   - These numbers never change once assigned.
   - Dynamic fields like “who is next” or “how many before you” are computed virtually from the current state.

3. Status & inclusion rules
   - `open`: request pending approval.
     - No `ticketNumber`/`queueNumber` yet.
     - May be shown in approval panels and used for “pending requests” counts.
   - `approved`: in the active service queue.
     - Assigned `ticketNumber` and `queueNumber` at approval time.
     - Participates in 3:1 scheduling and tags.
   - `rejected`:
     - If rejected while `open` (pre-approval): treated as if it never entered the queue. No numbers.
     - If we ever support rejecting after approval: keep its numbers for history, but exclude from active scheduling.
   - `closed` (finished):
     - Has `ticketNumber`/`queueNumber` assigned from when it was approved.
     - Remains in history (explains why the latest ticket numbers are high) but is excluded from active scheduling and wait-time math.

4. Tags are owned by the engine
   - Engine is responsible for applying:
     - `current`: the ticket being served.
     - `next-up`: the ticket that will be served immediately after current under the 3:1 rule.
     - `pending`: active tickets (approved) that are neither `current` nor `next-up`.
     - `awaiting-feedback`: manually toggled workflow state; excluded from active scheduling until resolved.
   - There is at most one `current` and one `next-up` per creator.
   - Frontend components (e.g. `TaskCard`, `TaskModule`, `NextUpSection`) display these tags; they never infer them.

5. 3:1 scheduling (priority : personal)
   - Default pattern: serve up to 3 priority tickets for each 1 personal ticket.
   - The pattern is:
     - Configurable per-creator (e.g. stored in `creators`/`queues`), but 3:1 is the default.
   - Scheduling rules:
     - Do NOT renumber tickets when new ones arrive.
     - Do NOT preempt `current`:
       - Once a ticket is `current`, it stays current until closed or manually changed (e.g. to `awaiting-feedback`).
     - `next-up` is dynamic:
       - When new priority tickets arrive, they can change who is `next-up` according to the 3:1 pattern.
       - This mirrors real-world bank behavior: you don’t kick out the person being served, but you can reorder the future line.

---

## Engine Responsibilities (ticketEngine)

Location: `convex/lib/ticketEngine.ts`.

### Input

- `creatorSlug`
- (Later) per-creator config:
  - `priorityToPersonalPattern` (default `{ priority: 3, personal: 1 }`).

### Output Structures

Shared interface for clients and Convex:

```ts
export interface TicketPosition {
  ref: string;
  queueKind: "personal" | "priority";
  status: "open" | "approved" | "rejected" | "closed";

  // Static numbers (only set once ticket is approved)
  ticketNumber?: number; // global monotonic per creator, assigned at approval
  queueNumber?: number; // monotonic per queueKind, assigned at approval

  // Dynamic, computed on read for active tickets
  tag?: "current" | "next-up" | "pending" | "awaiting-feedback";
  activeBeforeYou?: number; // how many active tickets are ahead in engine order
}

export interface QueueMetrics {
  enabled: boolean;
  activeCount: number; // active approved tickets participating in schedule
  currentTicketNumber?: number; // ticketNumber of current, if any
  nextTicketNumber?: number; // ticketNumber of next-up, if any
  etaMins?: number | null; // simple, consistent ETA calculation
}

export interface QueueSnapshot {
  personal: QueueMetrics;
  priority: QueueMetrics;
  general: QueueMetrics; // overall view (all active tickets)
}
```

### Core helpers

The engine exposes pure helpers that other Convex functions call:

- `getAllTicketsForCreator(ctx, creatorSlug)`
  - Returns all tickets for a creator.
- `assignNumbersOnApprove(ctx, ticket)`
  - Assigns `ticketNumber` and `queueNumber` when a ticket transitions to `approved`.
- `computeSchedule(ctx, creatorSlug, pattern?)`
  - Filters to active tickets (approved, not closed).
  - Respects existing `current` if still valid.
  - Applies the 3:1 (or configured) interleave to produce an ordered list.
- `computeTagsForCreator(ctx, creatorSlug)`
  - Uses `computeSchedule` to:
    - Clear `current`/`next-up` tags for that creator.
    - Set at most one `current` and one `next-up`.
- `getQueueSnapshot(ctx, creatorSlug)`
  - Uses `computeSchedule` to populate `QueueSnapshot`.
- `getTicketPositions(ctx, creatorSlug)`
  - Returns `TicketPosition[]` with static numbers + dynamic tags/activeBeforeYou.
- `getTicketPosition(ctx, ref)`
  - Returns a single `TicketPosition` for a ticket, for success page / detail views.
- `getNextTicketNumbersForCreator(ctx, creatorSlug)`
  - Returns the next ticket and per-queue numbers for display.

These helpers are deterministic and side-effect-free except where they explicitly patch tags or assign numbers.

---

## Phase Plan (Aligned with Existing Code)

### Phase 1 — Implement `ticketEngine`

- [x] Create `convex/lib/ticketEngine.ts` with:
  - [x] Data loaders for a creator’s tickets.
  - [x] `assignNumbersOnApprove` used by `tickets.approve`.
  - [x] `computeSchedule` implementing 3:1 (or configured) interleave.
  - [x] `computeTagsForCreator`, `getQueueSnapshot`, `getTicketPositions`, `getTicketPosition`.
- [x] Keep logic minimal and well-typed; no UI concerns.

### Phase 2 — Wire Convex APIs to the Engine

Refactor existing Convex functions to delegate to `ticketEngine`:

- [x] `convex/tickets.ts`
  - [x] `create` creates `open` tickets without numbers.
  - [x] `approve` calls `assignNumbersOnApprove` and `computeTagsForCreator`.
  - [x] `reject` keeps open tickets unnumbered.
  - [x] `markAsFinished` marks as `closed` then calls `computeTagsForCreator`.
  - [x] Expose `getByRef` and `recomputeWorkflowTagsForCreator` to work with engine.

- [x] `convex/queues.ts`
  - [x] `getSnapshot` returns `QueueSnapshot` from `ticketEngine.getQueueSnapshot`.

- [x] `convex/dashboard.ts`
  - [x] `getOverview` uses `ticketEngine.getQueueSnapshot` for queues.
  - [x] `getAllTicketsWithPositions` uses `ticketEngine.getTicketPositions`.
  - [x] `getNextTicketNumbers` uses engine counters.
  - [x] `getTicketPositionByRef` wraps `ticketEngine.getTicketPosition`.

### Phase 3 — Types & Data Providers

- [ ] `src/lib/types.ts`
  - [ ] Define shared `TicketPosition` and `QueueSnapshot` that mirror engine outputs.
  - [ ] Remove legacy `QueueSnapshot` fields (`kind`, `activeTurn`, `nextTurn`) from new codepaths.

- [ ] `src/lib/data/convex.ts`
  - [ ] Return engine-shaped `QueueSnapshot` from `queues.getSnapshot`.
  - [ ] Remove legacy fallbacks that use `activeTurn` / `nextTurn`.
  - [ ] Ensure any helpers that power tables / dashboard use `TicketPosition` from engine or are clearly marked deprecated.

- [ ] `src/lib/data/mock.ts`
  - [ ] Implement a lightweight mock engine so Storybook/tests behave like production.

### Phase 4 — Frontend Integration (Key Surfaces)

All of these should consume engine-driven data only:

- [ ] `src/app/[slug]/page.tsx`
  - [ ] Uses `queues.getSnapshot` for `QueueCard` data with engine `QueueSnapshot` shape.
  - [ ] Displays `currentTicketNumber`, `nextTicketNumber`, `activeCount`, `etaMins` without recomputing.

- [ ] Submit flow: `submit/page.tsx`, `SubmitClient.tsx`, `submit/success/page.tsx`
  - [ ] On create/approve, use API responses that include engine-assigned numbers.
  - [ ] Success page shows ticket details using `dashboard.getTicketPositionByRef` + engine snapshot only (no inferred math).

- [ ] Dashboard: `src/app/[slug]/dashboard/page.tsx`
  - [ ] Remove `sortTicketsByPriorityRatio` and any local 3:1 / tag logic.
  - [ ] Use `TicketPosition` from engine for:
    - NextUpSection
    - TaskModule
    - ApprovalPanel
    - TableComponent
    - CellComponent
  - [ ] Do not recompute `current` / `next-up` / `pending` locally.

### Phase 5 — QA & Guardrails

- [ ] Seed Convex with:
  - Mixed personal/priority tickets.
  - Various statuses (open, approved, awaiting-feedback, closed, rejected).
- [ ] Manual checks:
  - Landing page, submit, success, dashboard Next Up, approval panel, and table all show consistent numbers.
  - Approvals, rejections, closes, and awaiting-feedback toggles update tags & metrics everywhere.
- [ ] Tests:
  - Unit tests for `ticketEngine` (deterministic inputs → outputs).
  - Basic flow tests to ensure no client diverges from engine data.

---

## Pending Cleanup (Critical for Single Source of Truth)

These are the concrete pending tasks as of now:

1. Align shared types
   - Update `src/lib/types.ts` so `QueueSnapshot` / `QueueMetrics` / `TicketPosition` mirror `convex/lib/ticketEngine.ts`.
   - Remove usage of legacy `activeTurn`, `nextTurn`, and `kind` from new codepaths.

2. Remove dashboard 3:1 and tag logic from client
   - In `src/app/[slug]/dashboard/page.tsx`:
     - Remove `sortTicketsByPriorityRatio`.
     - Stop computing `current` / `next-up` / `pending` based on local arrays.
     - Derive all ordering, tags, and numbers from `api.dashboard.getAllTicketsWithPositions`.

3. Fix submit flow to trust engine
   - Ensure `submit/page.tsx`, `SubmitClient.tsx`, and `submit/success/page.tsx`:
     - Use engine-backed `QueueSnapshot` for wait-time/queue displays.
     - Use `dashboard.getTicketPositionByRef` for final ticket numbers instead of any inferred math.

4. Clean up `ConvexDataProvider`
   - Make `getQueueSnapshot` return the engine `QueueSnapshot` shape.
   - Remove legacy fallbacks (`activeTurn`, `nextTurn`), or confine them to explicit, deprecated helpers.
   - Prefer direct usage of Convex queries in components where possible to keep UIs “dumb”.

5. Remove all remaining client-side position/numbering computation
   - Search for and eliminate:
     - Local 3:1 scheduling logic.
     - Any `current`/`next-up`/`pending` calculations not based on engine tags.
     - Any ticket numbering derived from indexes or `nextTurn - 1`.
   - If a component needs order, tags, or numbers, it must call ticketEngine-backed Convex functions.

Only once these are done is `ticketEngine` the enforced single source of truth.
