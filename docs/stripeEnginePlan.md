# Stripe Engine Plan (v3 — Manual Capture First)

**Current Status:** Active / In-Progress  
**Last Updated:** v3 — Pivot to PaymentIntents with Manual Capture

---

## History & Context (v1 → v2 → v3)

- **v1 Goal:** Simple "platform holds funds" model with monthly payouts.
- **v2 Implementation:** Used Stripe **Checkout Sessions** charging the customer immediately. Ticket approval was purely business logic and did **not** control when Stripe captured funds.
- **v3 Pivot (this document):**
  - We now **insist** that card payments are **authorized but not captured** until the creator explicitly approves the ticket.
  - This means **refactoring the payment flow** to use the **Stripe Payment Intents API** (specifically with manual capture), as described in the [Payment Intents docs](https://docs.stripe.com/payments/payment-intents).
  - The main reasons:
    - **Payment Intents API** provides a modern, robust lifecycle for complex flows (auth → capture).
    - Avoid paying extra fees on refunds when creators reject (cancel the intent instead).
    - Run creator/queue-specific checks before money moves.

> **Non‑negotiable invariant (v3):**  
> A ticket is “submitted” and the customer’s card is authorized, but **Stripe does not capture funds** until the creator hits **Approve** in the dashboard.

---

## Core Principles

1.  **Single Source of Truth (Convex)**
    - **`payments` table:** The ledger of all incoming money.
    - **`payouts` table:** The ledger of all outgoing transfers.
    - **`stripeEngine` (lib):** The logic that computes fees, totals, and projections.
    - **UI is "Dumb":** The frontend never calculates fees. It only renders what `stripeEngine` returns.

2.  **Platform Holds, Then Pays**

- User **authorizes** a charge via a PaymentIntent (manual capture).
- Platform decides whether to **capture** or **cancel/refund** based on creator approval.
- Once captured, funds are part of the platform balance.
- Platform pays Creator monthly (minus fees) via Stripe Connect transfers.

3.  **Fee Rule (Block-Based)**
    - For each creator, per calendar month:
    - **Threshold:** $50 (5000 cents).
    - **Fee:** $3.33 (333 cents) kept by platform for every full $50 block.
    - **No fee** on gross earnings below $50.
    - _Note:_ Stripe processing fees (2.9% + 30¢) are separate and charged by Stripe directly.

---

## Architecture & Responsibilities (v3)

The "Engine" is still split into **Write-Side** (ingestion + Stripe integration) and **Read-Side** (earnings calculations), but the **write-side for ticket payments is now PaymentIntent + manual capture.**

### 1. Write-Side: Ingestion & Integration (PaymentIntents with Manual Capture)

**Location:** `convex/payments.ts` + `convex/stripeOnboarding.ts` + `src/app/api/*`

#### 1.1 Ticket submission → PaymentIntent (manual capture)

- **Action:** `createManualPaymentIntent` (Convex action, v3)
  - **Inputs:** `creatorSlug`, `ticketRef`, `amountCents`, `currency`.
  - **Behavior:**
    - Creates a **PaymentIntent** with:
      - `amount = amountCents`
      - `currency = "usd"` (for now)
      - `capture_method = "manual"`
      - `metadata` including:
        - `creatorSlug`
        - `ticketRef`
    - Returns:
      - `paymentIntentId`
      - `clientSecret`
  - **Client side (Submit page):**
    - Uses Stripe.js + Elements (or a minimal equivalent) to:
      - Collect card details.
      - Confirm the PaymentIntent **without capture** (status becomes `requires_capture` / `requires_action` / `succeeded` depending on flow).
    - On success, stores `paymentIntentId` on the Convex `tickets` row (or a dedicated field).

#### 1.2 Creator approval → capture PaymentIntent

- **Mutation:** `capturePaymentForTicket` (Convex mutation, v3)
  - **Inputs:** `ticketRef` (or `paymentIntentId`).
  - **Behavior:**
    - Look up the ticket by `ticketRef`.
    - Ensure it has a `paymentIntentId` and is still in a capturable state.
    - Call `stripe.paymentIntents.capture(paymentIntentId, ...)`.
    - On success:
      - Insert into `payments` table (or rely on webhook `payment_intent.succeeded`, see below).
      - Mark ticket as paid/approved (`status: "approved"`) and persist queue numbers/tags as we already do.
    - On failure:
      - Mark something like `paymentStatus: "capture_failed"` and log for investigation.

#### 1.3 Creator rejection → cancel or refund

- **Mutation:** `cancelOrRefundPaymentForTicket` (Convex mutation, v3)
  - **Inputs:** `ticketRef`.
  - **Behavior:**
    - If the PaymentIntent is **not yet captured**:
      - Call `stripe.paymentIntents.cancel(paymentIntentId)`.
      - Ticket goes to `status: "rejected"`.
      - No row is ever added to `payments` (we only track captured funds).
    - If it **has been captured** (edge cases, or future flows):
      - Call `stripe.refunds.create({ payment_intent: paymentIntentId, ... })`.
      - Update the corresponding `payments` row to `status: "refunded"`.
    - This keeps the ledger truthful while protecting against double fees where possible.

#### 1.4 Webhook ingestion (PaymentIntents, not Checkout Sessions)

- **Endpoint:** `src/app/api/stripe/events/route.ts`
  - **Primary events:**
    - `payment_intent.succeeded` → insert into `payments` table (if not already inserted via capture mutation).
    - `charge.refunded` / `payment_intent.canceled` → update existing payment records if needed.
  - **Important:** In v3, we no longer depend on `checkout.session.completed` for the engine. The canonical source for “money actually moved” is **captured** PaymentIntents.

> **Key invariant:** The `payments` table only contains **captured** money. Tickets with authorized-but-not-captured PaymentIntents are _visible in the ticket engine_, not as earnings.

#### 1.5 Legacy Checkout Sessions (v2)

- We may keep the old `createCheckoutSession` flow for some simple/demo paths, but for the core favor/ticket queue:
  - **Manual capture via PaymentIntents is mandatory.**
  - Any remaining Checkout uses must be clearly marked as legacy and **must not** be wired to the ApprovalPanel-driven queues.

### 2. Read-Side: Computations & Dashboard

**Location:** `convex/lib/stripeEngine.ts`

This module is **read-only** and pure. It does not call Stripe.

- **`getEarningsForPeriod`:** Raw sum of `payments` for a time range.
- **`computeEarningsSummary`:** Applies the $50 / $3.33 fee rule.
- **`getEarningsDashboardData`:** The **single query** used by the frontend `EarningsPanel`.
  - Returns: Current month stats, last 3 months, all-time totals, next payout status.

### 3. Business Logic: Ticket Workflow

**Location:** `convex/tickets.ts`

- **`approve` / `reject`:**
  - Updates ticket status (`open` -> `approved`/`rejected`) **and** now coordinates with payments:
    - **On approve:** must call `capturePaymentForTicket` before finalizing approval.
    - **On reject:** must call `cancelOrRefundPaymentForTicket` before finalizing rejection.
  - _Implication (v3):_ A ticket cannot quietly move to “approved” without either a successful capture or an explicit failure state. A rejected ticket should, where possible, _never_ leave a captured payment “dangling” without a corresponding refund/cancel.

---

## Data Models (Schema)

### `payments`

Recorded when a PaymentIntent is successfully **captured** (either inline in `capturePaymentForTicket` or in the `payment_intent.succeeded` webhook).

- `creatorSlug`: string
- `amountGross`: number (cents)
- `currency`: "usd"
- `status`: "succeeded"
- `provider`: "stripe"
- `externalId`: string (Stripe PaymentIntent ID or Checkout Session ID; v3 standardizes on PaymentIntent ID for manual capture flow)
- `ticketRef`: string

### `payouts`

Generated by `scheduleMonthlyPayouts`.

- `creatorSlug`: string
- `periodStart`, `periodEnd`: timestamps
- `grossCents`, `platformFeeCents`, `payoutCents`: computed numbers
- `status`: "pending" | "paid" | "failed"
- `stripeTransferId`: string (optional)

---

## Implementation Map

| Component                   | File Path                                                                                                       | Status           |
| :-------------------------- | :-------------------------------------------------------------------------------------------------------------- | :--------------- |
| **Schema**                  | `convex/schema.ts`                                                                                              | ✅ Done          |
| **Onboarding**              | `convex/stripeOnboarding.ts`                                                                                    | ✅ Done          |
| **Legacy Checkout (v2)**    | `convex/payments.ts` (`createCheckoutSession`)                                                                  | ✅ Done (Legacy) |
| **Manual Capture API (v3)** | `convex/payments.ts` (`createManualPaymentIntent`, `capturePaymentForTicket`, `cancelOrRefundPaymentForTicket`) | 🚧 Top Priority  |
| **Ingestion**               | `convex/payments.ts` (`recordStripePayment`)                                                                    | ✅ Done          |
| **Webhook**                 | `src/app/api/stripe/events/route.ts`                                                                            | ✅ Done          |
| **Calculations**            | `convex/lib/stripeEngine.ts`                                                                                    | ✅ Done          |
| **Payout Logic**            | `convex/payments.ts` (`scheduleMonthlyPayouts`)                                                                 | 🚧 In Progress   |
| **Frontend**                | `src/components/dashboard/earnings/*`                                                                           | ✅ Done          |

---

## Phase Plan (Revised)

### Phase 1 (v3) — Manual Capture Flow (Top Priority)

- [ ] Implement `createManualPaymentIntent` in `convex/payments.ts`.
- [ ] Wire submit flow (`[slug]/submit`) to:
  - Call `createManualPaymentIntent`.
  - Use Stripe.js + Elements to confirm the PaymentIntent without capture.
  - Store `paymentIntentId` on the relevant ticket.
- [ ] Implement `capturePaymentForTicket` and `cancelOrRefundPaymentForTicket` in `convex/payments.ts`.
- [ ] **Wire Approval UI:**
  - Update `src/components/checkout/ticketApprovalCard.tsx` (used in `ApprovalPanel`) to call the capture/cancel actions.
  - Ensure UI handles the async nature of Stripe calls (loading states).
- [ ] Update webhook handler to treat `payment_intent.succeeded` as the primary ingestion event for v3.

### Phase 2 — Monthly Payouts
- [x] `scheduleMonthlyPayouts` mutation skeleton exists in `convex/payments.ts`.
- [ ] **Refine Payout Logic:**
  - **Standard:** Calendar month (1st to last day). This simplifies accounting and tax reporting compared to rolling windows.
  - **Trigger:** Manual Admin Button (initially) -> Cron Job (later).
- [ ] **Connect Transfer Action:** Implement the actual `stripe.transfers.create` call.
- [ ] **Admin Trigger:** Create a hidden Admin button to run `scheduleMonthlyPayouts` for the previous month.

### Phase 3 — Handling Rejections & Notifications

- [ ] Ensure `cancelOrRefundPaymentForTicket` covers:
  - Uncaptured PaymentIntents → `paymentIntents.cancel`.
  - Captured PaymentIntents → `refunds.create` and update of `payments` status.
- [ ] UI: Make “Reject” clearly communicate whether a customer will be charged, refunded, or never charged in the first place.
- [ ] **Email Notifications:**
  - Send "Ticket Approved" (and card charged) email.
  - Send "Ticket Rejected" (and card released) email.
  - *Note:* Implement this alongside Stripe integration to ensure users are notified of money movement.

### Phase 4 — Extensibility (Future)

- [ ] Support PayPal/Crypto by adding new providers to `payments` table.
- [ ] `stripeEngine` math remains unchanged (it just sums `payments`).

---

## Critical Integration Notes (For LLMs)

1.  **Payment Intents API is REQUIRED.**
    - Use the **Stripe Payment Intents API** ([docs](https://docs.stripe.com/payments/payment-intents)) to handle the lifecycle.
    - **Flow:** Create Intent (server) → Confirm (client) → Capture (server on approval) or Cancel (server on rejection).
    - **Configuration:** Use `capture_method: "manual"` to ensure funds are **held** (authorized) but not transferred until the Creator explicitly approves.
    - Do **not** introduce new Checkout-based flows for the main favor queue unless explicitly marked as legacy.
2.  **Webhook is Key:** The `payments` table is **only** populated when money is actually captured (typically via `payment_intent.succeeded`). If the dashboard is empty, check the webhook URL and Stripe Dashboard events first.
3.  **Idempotency:** Always check `externalId` (PaymentIntent ID) before inserting into `payments` or `payouts`.
4.  **ApprovalPanel semantics:**
    - “Approve” must eventually imply a successful capture or a visible failure.
    - “Reject” must cancel or refund any associated PaymentIntent before final status is stored whenever possible.
