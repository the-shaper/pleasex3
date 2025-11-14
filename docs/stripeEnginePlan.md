# Stripe Engine Plan (v1)

## Why We’re Here

- We want creators to connect their own payout accounts while keeping all money-flow rules simple, predictable, and centrally enforced.
- We already have a strong single-source-of-truth for queues and tickets (`ticketEngine` in Convex).
- We now need a similar, minimal “payments engine” that:
  - Tracks per-creator earnings,
  - Applies a clear platform fee rule,
  - Coordinates payouts via Stripe Connect (and later, other providers),
  - Exposes simple, read-only views to the frontend through a dedicated `Earnings` dashboard tab.

The guiding principle is the same as the ticket engine:
All financial rules live in Convex/Stripe; UIs stay “dumb” and only render what the engine says.

---

## Core Principles

1. Single source of truth (payments)
   - All payment and payout math is centralized in Convex.
   - Stripe is the ledger of actual charges and transfers.
   - No UI computes fees, thresholds, or monthly totals from scratch.

2. Platform holds, then pays out
   - All customer payments are charged to the platform’s Stripe account.
   - Funds are logically attributed to creators via Convex records.
   - Creators are paid out on a schedule (e.g. monthly) based on engine rules.

3. Simple fee rule (threshold-based)
   - For each creator, per calendar month (or configured period):
     - Let \( G \) = total gross sales (in USD-equivalent cents) attributed to that creator.
     - If \( G < 50USD \): platform fee = 0.
     - If \( G \ge 50USD \): platform fee = 3.3% of \( G \) (on the full amount).
   - Stripe processing fees are separate and always applied by Stripe; our 3.3% is on creator earnings, not on top of Stripe fees.

4. Predictable creator experience
   - Creators can see, in the `Earnings` tab of their dashboard:
     - Current month gross earnings.
     - Whether the $50 threshold is reached.
     - Current projected platform fee.
     - Projected payout amount and payout date.
   - No surprise clawbacks. Once a month closes and payouts are executed, the results are final.

5. Extensible, provider-agnostic design
   - Stripe Connect is the first-class implementation.
   - The engine API is shaped so PayPal / Bitcoin processors can plug in later without changing client surfaces.
   - One unified model: “payments in”, “fees”, “payouts” — regardless of provider.

---

## Engine Responsibilities (`stripeEngine`)

**Location (planned):** `convex/lib/stripeEngine.ts`

This module coordinates:

- Persisted payment records.
- Monthly earnings / fee / payout calculations.
- Integration points with Stripe Connect.
- Read-only summaries for the `Earnings` dashboard.

### Inputs

- `creatorSlug`
- Stripe events (via webhook) containing:
  - `amount`, `currency`, `payment_intent` / `checkout.session`
  - `metadata.creatorSlug`, `metadata.ticketRef` (for attribution)
- (Later) multi-provider metadata for non-Stripe payments.

### Output Structures

Shared interfaces (TS, mirrored in `src/lib/types.ts`), designed for the `Earnings` tab modules:

```ts
export interface CreatorEarningsSummary {
  creatorSlug: string;
  periodStart: number; // timestamp (inclusive)
  periodEnd: number; // timestamp (exclusive)

  grossCents: number; // total attributed sales for period
  thresholdCents: number; // 5000 (for $50) or configured
  platformFeeRateBps: number; // 330 = 3.3%
  platformFeeCents: number; // 0 or gross * 0.033 (rounded)
  payoutCents: number; // gross - platformFeeCents
  thresholdReached: boolean; // gross >= threshold
}

export interface PayoutRecord {
  id: string;
  creatorSlug: string;
  periodStart: number;
  periodEnd: number;
  grossCents: number;
  platformFeeCents: number;
  payoutCents: number;
  currency: string;
  stripeTransferId?: string; // when executed via Stripe
  status: "pending" | "processing" | "paid" | "failed";
  createdAt: number;
}

export interface StripeConnectionStatus {
  connected: boolean;
  stripeAccountId?: string;
  detailsSubmitted?: boolean;
}

export interface EarningsDashboardData {
  connection: StripeConnectionStatus;
  currentPeriod: CreatorEarningsSummary; // "This month"
  lastThreePeriods: CreatorEarningsSummary[]; // up to 3 previous months
  allTimeGrossCents: number;
  allTimePlatformFeeCents: number;
  allTimePayoutCents: number;
  upcomingPayout?: PayoutRecord | null; // "Next payout" module
  payoutHistory: PayoutRecord[]; // For payout history table
}
```

These shapes are the only contract the `Earnings` UI should rely on. All numbers and statuses come from Convex, not recomputed on the client.

---

## Core Helpers

The `stripeEngine` exposes pure(ish) helpers and Convex glue:

1. `recordStripePayment(ctx, stripeEvent)`
   - Called from the Stripe webhook handler.
   - Validates event type and success status.
   - Extracts:
     - `creatorSlug` from metadata.
     - `amount`, `currency`, `payment_intent` id.
   - Inserts a `payments` document:
     - `{ creatorSlug, amountGross, currency, createdAt, status: "succeeded", provider: "stripe", externalId }`.
   - Idempotent: safe to call multiple times for the same event.

2. `getEarningsForPeriod(ctx, creatorSlug, periodStart, periodEnd)`
   - Reads all succeeded payments for that creator in [periodStart, periodEnd).
   - Returns raw sums:
     - `grossCents`
     - `currency` (assume USD or normalize; v1 keep USD only).

3. `computeEarningsSummary(ctx, creatorSlug, periodStart, periodEnd)`
   - Uses `getEarningsForPeriod`.
   - Applies business rule:
     - `thresholdCents = 5000`.
     - If `grossCents < thresholdCents`:
       - `platformFeeCents = 0`.
     - Else:
       - `platformFeeCents = round(grossCents * 0.033)`.
     - `payoutCents = grossCents - platformFeeCents`.
   - Returns `CreatorEarningsSummary`.

4. `getCurrentPeriodSummary(ctx, creatorSlug)`
   - Convenience wrapper:
     - Determines the current calendar month range.
     - Calls `computeEarningsSummary`.
   - Used by `Earnings` tab to show live projected payout.

5. `getLastThreePeriodsSummaries(ctx, creatorSlug)`
   - Computes up to three previous monthly `CreatorEarningsSummary` entries.
   - Powers the "Last three months" module.

6. `getAllTimeEarnings(ctx, creatorSlug)`
   - Aggregates all payments for that creator.
   - Returns `{ allTimeGrossCents, allTimePlatformFeeCents, allTimePayoutCents }`.
   - Powers the "All time" stats module.

7. `scheduleMonthlyPayouts(ctx, periodStart, periodEnd)`
   - Run at end of each period (manual trigger or scheduled job).
   - For each creator with:
     - `stripeAccountId` set,
     - `grossCents > 0`:
       - Calls `computeEarningsSummary`.
       - If `payoutCents > 0`:
         - Creates a `PayoutRecord` with `status: "pending"`.
         - Invokes `createStripeTransfer`.
   - Ensures one payout per creator per period (idempotent).

8. `createStripeTransfer(ctx, payoutRecord)`
   - Calls Stripe Connect APIs:
     - `destination = creator.stripeAccountId`.
     - `amount = payoutCents`.
     - `currency = "usd"`.
     - `metadata` linking back to `payoutRecord.id`, `period`.
   - On success:
     - Updates `PayoutRecord` with `stripeTransferId`, `status: "paid"`.
   - On failure:
     - Marks `status: "failed"` with error data for investigation / retry.

9. `getEarningsDashboardData(ctx, creatorSlug)`
   - Composition helper specifically for the `Earnings` tab.
   - Returns `EarningsDashboardData` by composing:
     - Stripe connection status from `creators` table.
     - `getCurrentPeriodSummary`.
     - `getLastThreePeriodsSummaries`.
     - `getAllTimeEarnings`.
     - Next upcoming `PayoutRecord` (if any).
     - Recent `PayoutRecord` entries.
   - This is the **single** query the frontend should call for the Earnings view.

All payout/fee decisions depend only on these helpers and the underlying `payments` data.

---

## Phase Plan

### Phase 1 — Schema & Engine Skeleton

Backend-first, no UI logic:

- [x] Add `payments` table in Convex schema:
  - `creatorSlug`, `amountGross`, `currency`, `status`, `createdAt`, `provider`, `externalId`.
- [x] Add `payouts` table:
  - Mirrors `PayoutRecord` structure.
- [x] Add fields to `creators`:
  - `stripeAccountId`, `payoutEnabled`, optional config.
- [x] Create `convex/lib/stripeEngine.ts` with:
  - [x] `getEarningsForPeriod`.
  - [x] `computeEarningsSummary`.
  - [x] `getCurrentPeriodSummary`.
  - [x] `getLastThreePeriodsSummaries`.
  - [x] `getAllTimeEarnings`.
  - [x] `getEarningsDashboardData`.
- [x] Mirror shared types into `src/lib/types.ts`.

Keep this file minimal, deterministic, and free of UI concerns.

---

### Phase 2 — Stripe Connect Integration

- [x] Onboarding
  - [x] Convex mutation/action to create/connect a Stripe Connect account for a creator.
  - [x] Store `stripeAccountId` and connection status on success.
  - [x] `Earnings` tab: "Connect Stripe Payouts" button calls this flow.

- [x] Payment capture (buyers → platform)
  - [x] Convex action to create Checkout Session / PaymentIntent:
    - Charge on platform.
    - `metadata.creatorSlug`, `metadata.ticketRef`.
  - [x] Client submit flow uses this action and redirects to Stripe-hosted checkout.

- [x] Webhook ingestion
  - [x] HTTP endpoint (Next.js or Convex HTTP) to receive Stripe events.
  - [x] On `payment_intent.succeeded` / `checkout.session.completed`:
    - [x] Call `stripeEngine.recordStripePayment`.
    - [x] Do not compute fees here; just record.

---

### Phase 3 — Monthly Payouts & Admin Controls

- [x] Implement `scheduleMonthlyPayouts`:
  - [x] For a given (year, month):
    - Enumerate creators with payments.
    - Use `computeEarningsSummary`.
    - Create `PayoutRecord` for each creator with `payoutCents > 0`.
    - Call `createStripeTransfer` to connected accounts.
- [ ] Expose a Convex mutation:
  - [ ] `admin.runMonthlyPayouts({ year, month })` for manual triggering.
- [ ] Add simple admin/log view (can be separate from creator dashboard):
  - [ ] List payouts per period (creator, gross, fee, payout, status).

For v1, payouts can be triggered manually (button / script). Scheduling can come later.

---

### Phase 4 — Frontend Integration (Creator `Earnings` Tab)

All surfaces must treat `stripeEngine` as the single source of truth for money.

- [x] `src/lib/types.ts`
  - [x] Add `CreatorEarningsSummary`, `PayoutRecord`, `StripeConnectionStatus`, `EarningsDashboardData`.

- [x] Update `[slug]/dashboard/page.tsx` sidebar:
  - [x] Add `Earnings` section/tab (e.g. `?tab=earnings`).

- [x] Create `Earnings` view component(s) under `src/components/dashboard/earnings/`:
  - [x] `EarningsPanel` (top-level for `?tab=earnings`).
  - [x] Sections (all purely presentational, **no local math**):
    - [x] `ConnectStripeCard` — uses `connection` from `EarningsDashboardData`.
    - [x] `EarningsSummaryCard` — uses `currentPeriod`, `lastThreePeriods`, `allTime*`.
    - [x] `PayoutsCard` — uses `upcomingPayout` and `payoutHistory`.

- [x] `[slug]/dashboard/page.tsx` (or a thin wrapper) should:
  - [x] Call Convex query that returns `EarningsDashboardData`.
  - [x] Render `EarningsPanel` when `tab === "earnings"`.
  - [x] Not perform any fee or threshold calculations client-side.

This mirrors the `ticketEngine` integration approach: backend provides complete, ready-to-render data.

---

### Phase 5 — Extensibility & BTC/PayPal

Once Stripe v1 is stable:

- [ ] Generalize `payments` to include:
  - `provider: "stripe" | "paypal" | "btc"` etc.
- [ ] For each provider:
  - [ ] Ingest confirmed payments into the same `payments` table.
- [ ] Reuse the same:
  - `computeEarningsSummary`.
  - `scheduleMonthlyPayouts`.
  - `PayoutRecord`/`EarningsDashboardData` logic.
- [ ] BTC:
  - [ ] Use a trusted processor (e.g. Coinbase Commerce / BTCPay).
  - [ ] On confirmed invoice, create a `payments` entry.
  - [ ] Decide whether payout is in fiat or BTC; engine logic stays identical.

The key invariant:
All providers funnel into one consistent monthly earnings + fee + payout pipeline.

---

### Phase 6 — Guardrails & Transparency

- [ ] Ensure idempotency:
  - Webhook handlers and payout runners must handle retries safely.
- [ ] Logging:
  - [ ] Log each Stripe event → `payments`.
  - [ ] Log each payout action with links to events.
- [ ] Creator-facing clarity:
  - [ ] Terms clearly describe:
    - Monthly payout schedule.
    - $50 threshold.
    - 3.3% fee on all earnings once threshold reached.
    - Stripe fees are separate.
- [ ] Respect the same philosophy as `ticketEngine`:
  - Engine computes; clients render without re-deriving business rules.

Only once these are in place is `stripeEngine` the enforced financial source of truth, matching the role `ticketEngine` plays for queues.
