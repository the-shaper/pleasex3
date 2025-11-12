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

Location: `convex/lib/ticketEngine.ts` (new module).

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
  - Filters to active tickets (approved, not closed, not awaiting-feedback).
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

These helpers are deterministic and side-effect-free except where they explicitly patch tags or assign numbers.

---

## Phase Plan (Aligned with Existing Code)

### Phase 1 — Implement `ticketEngine`

- Create `convex/lib/ticketEngine.ts` with:
  - Data loaders for a creator’s tickets.
  - `assignNumbersOnApprove` used by `tickets.approve`.
  - `computeSchedule` implementing 3:1 (or configured) interleave.
  - `computeTagsForCreator`, `getQueueSnapshot`, `getTicketPositions`, `getTicketPosition`.
- Keep logic minimal and well-typed; no UI concerns.

### Phase 2 — Wire Convex APIs to the Engine

Refactor existing Convex functions to delegate to `ticketEngine`:

- `convex/tickets.ts`
  - `create`:
    - Creates `open` ticket with no queue/ticketNumber.
  - `approve`:
    - Calls `assignNumbersOnApprove`.
    - Calls `computeTagsForCreator`.
  - `reject`:
    - If rejecting an `open` ticket: just mark as rejected (never numbered).
  - `markAsFinished`:
    - Marks as `closed` and then calls `computeTagsForCreator`.
  - Expose `getByRef` so it returns engine-enriched `TicketPosition` (or we add `tickets.getPosition`).

- `convex/queues.ts`
  - `getSnapshot`:
    - Returns `QueueSnapshot` from `ticketEngine.getQueueSnapshot`.

- `convex/dashboard.ts`
  - `getOverview` / `getAllTicketsWithPositions`:
    - Use `ticketEngine.getTicketPositions`.
    - Remove any local 3:1 or tag logic.

### Phase 3 — Types & Data Providers

- `src/lib/types.ts`
  - Define shared `TicketPosition` and `QueueSnapshot` to mirror engine outputs.
- `src/lib/data/convex.ts`
  - Map Convex responses directly to these types.
  - No client-side ordering or `nextTurn - 1` patches.
- `src/lib/data/mock.ts`
  - Implement a lightweight mock engine so Storybook/tests behave like production.

### Phase 4 — Frontend Integration (Key Surfaces)

All of these should consume engine-driven data only:

- `src/app/[slug]/page.tsx`
  - Uses `queues.getSnapshot` for `QueueCard` data.
  - Displays consistent `currentTicketNumber`, `nextTicketNumber`, `activeCount`, `etaMins`.

- Submit flow: `submit/page.tsx`, `SubmitClient.tsx`, `submit/success/page.tsx`
  - On create/approve, use API response that includes `ticketNumber`/`queueNumber`.
  - Success page shows “You are ticket X in Y queue (global #Z)” without doing math.

- Dashboard: `src/app/[slug]/dashboard/page.tsx`
  - Replace local `sortTicketsByPriorityRatio` and manual tag calculations with `TicketPosition` from engine.
  - `NextUpSection`, `TaskModule`, `ApprovalPanel`, `TableComponent`, `cellComponent`:
    - Render `tag`, `ticketNumber`, `queueNumber`, `activeBeforeYou` as provided.
    - Do not recompute 3:1 or `current`/`next-up` locally.

### Phase 5 — QA & Guardrails

- Seed Convex with:
  - Mixed personal/priority tickets.
  - Various statuses (open, approved, awaiting-feedback, closed, rejected).
- Manual checks:
  - Landing page, submit, success, dashboard Next Up, approval panel, and table all show consistent numbers.
  - Approvals, rejections, and closes update tags & metrics everywhere.
- Tests:
  - Unit tests for `ticketEngine` (deterministic inputs → outputs).
  - Basic flow tests to ensure no client diverges from engine data.

---

## Notes / Non-Goals for v1

- No client should implement or duplicate 3:1 logic. If you see `sortTicketsByPriorityRatio` or manual `current/next-up` logic in the UI or providers, it should be refactored to rely on `ticketEngine` outputs.
- ETAs can start simple (e.g. fixed minutes per ticket) and be refined later without changing consumers.
- Configurable patterns (2:1, 1:1, etc.) are supported by design but only 3:1 is required now.

## Pending Cleanup (Critical for Single Source of Truth)

These must be completed to avoid "ghost" behavior and duplicated logic:

1. Data cleanup (run once per environment)
   - Run `tickets.cleanupTicketNumbers`.
   - Ensure no `ticketNumber`/`queueNumber` exist on tickets with `status` in `{"open","rejected"}`.
   - Remove or fix any legacy approved tickets with duplicate `ticketNumber` for the same creator.

2. Success page uses engine, not math
   - Add a Convex query (e.g. `dashboard.getTicketPositionByRef`) that wraps `ticketEngine.getTicketPosition`.
   - Update `src/app/[slug]/submit/success/page.tsx` to:
     - fetch that position by `ref`;
     - display `ticketNumber` / `queueNumber` from engine only;
     - never infer position from `nextTurn` or snapshots.

3. Remove legacy queue fields from UI logic
   - Stop reading `activeTurn` / `nextTurn` from the `queues` table in any UI.
   - `QueueCard`:
     - `Current Turn` = `queueSnapshot.*.currentTicketNumber`.
     - `Next Available` = `dashboard.getNextTicketNumbers` output.

4. Table & NextUp use engine positions only
   - `TableComponent` rows come solely from `dashboard.getAllTicketsWithPositions` (`TicketPosition[]`).
   - `NextUpSection` uses `TicketPosition`/`TaskCardData` derived from engine; no local 3:1 or tag math.

5. Delete / stop calling old helpers
   - Remove any remaining usages of:
     - `sortTicketsByPriorityRatio`.
     - manual `current`/`next-up`/`pending` calculations in React.
     - any computation of "ticket #" based on `nextTurn - 1` or array index.
   - If a component needs order, tags, or numbers, it must call ticketEngine-backed Convex functions.

Only once these are done is `ticketEngine` the true, enforced single source of truth.
