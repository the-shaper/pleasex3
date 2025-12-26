# Currency Fix Execution Plan

## Objective

Fix global payment acceptance issues by properly associating PaymentIntents with Stripe Connect accounts using `on_behalf_of`, while removing all hardcoded currency conversion code and letting Stripe handle currency conversion natively.

## Core Principle: Manual Capture is NON-NEGOTIABLE

**CRITICAL**: Manual capture (`capture_method: "manual"`) is a core function of the app. Any changes that break manual capture are unacceptable and will be rejected.

---

## Problem Analysis

### Root Cause

**PaymentIntents created on platform account without Connect association.** This means:

- PaymentIntents don't inherit connected account's currency capabilities
- International cards fail because platform account may not have all currencies enabled
- No association between PaymentIntent and connected account

The hardcoded currency conversion was a misguided attempt to fix this by manually converting amounts. This is wrong because:

1. Currency is dynamic - you cannot hardcode rates in production
2. Stripe already supports multi-currency
3. The real fix is using Stripe Connect correctly with `on_behalf_of`

### Current Issues

1. **PaymentIntents created on platform account without Connect association**
   - PaymentIntents don't inherit connected account's currency capabilities
   - International cards fail because platform account may not have all currencies enabled
   - No association between PaymentIntent and connected account

2. **Hardcoded currency conversion rates (ABSOLUTELY IDIOTIC - REMOVE ALL)**
   - `convex/payments.ts`: `CURRENCY_USD_RATES` constant (lines ~434-443)
   - `convex/payments.ts`: `convertUsdCentsToLocal()` function (lines ~449-452)
   - `src/lib/currency.ts`: `CURRENCIES` object with hardcoded `usdRate` values
   - `src/lib/currency.ts`: `convertUsdToLocalCents()` and `convertLocalToUsdCents()` functions
   - Manual conversion happens before creating PaymentIntent, which is unnecessary

3. **Unnecessary currency conversion logic**
   - Frontend converts USD → local currency using hardcoded rates
   - Backend converts USD → local currency using hardcoded rates
   - Stripe can handle this automatically, making our conversion redundant

### Display vs Processing

**IMPORTANT - APP DISPLAYS USD ONLY:**

- The app shows amounts in dollars only
- Stripe handles currency conversion behind the scenes
- The user only sees their local currency in their Stripe account statement

---

## Solution: Use `on_behalf_of` Parameter

### Why `on_behalf_of` (NOT Stripe-Account header)

- ✅ **Preserves manual capture**: Funds stay on platform account
- ✅ **Uses connected account's currency capabilities**: PaymentIntent inherits connected account settings
- ✅ **Maintains existing transfer flow**: `stripe.transfers.create` still works
- ✅ **Global solution**: Works for ALL currencies, not just MXN
- ✅ **Clean architecture**: No hardcoded rates, let Stripe handle FX

### Why NOT Stripe-Account header

- ❌ **Breaks manual capture**: Funds go directly to connected account
- ❌ **Incompatible with current architecture**: Requires restructuring payout flow

### Webhook Impact: NONE

The webhook `capturePaymentForTicket` uses the PaymentIntent directly from Stripe (lines 669-670 in payments.ts), so removing return values won't break anything. Payment amounts are pulled from the Stripe API response, not from our backend return values.

---

## Execution Tasks

### Phase 1: Fix PaymentIntent Creation (CRITICAL - DO FIRST)

#### Task 1.1: Add `on_behalf_of` to PaymentIntent Creation

**File**: `convex/payments.ts`
**Location**: `createManualPaymentIntent` action (line ~497)

**Changes**:

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: chargeAmountCents,
  currency: chargeCurrency,
  capture_method: "manual", // CRITICAL: Must remain manual
  automatic_payment_methods: { enabled: true },
  on_behalf_of: creator.stripeAccountId, // ADD THIS LINE
  metadata: {
    creatorSlug: args.creatorSlug,
    ticketRef: args.ticketRef,
    originalUsdCents: String(args.amountCents),
    chargeCurrency,
  },
});
```

**Verification**:

- [ ] PaymentIntent created successfully
- [ ] Manual capture still works (funds stay on platform)
- [ ] International cards accepted
- [ ] Webhook events still fire correctly

---

### Phase 2: Remove Hardcoded Currency Conversion (CLEANUP)

#### Task 2.1: Remove Hardcoded Rates from `convex/payments.ts`

**File**: `convex/payments.ts`

**Remove**:

- [ ] `CURRENCY_USD_RATES` constant (lines ~434-443)
- [ ] `convertUsdCentsToLocal()` function (lines ~449-452)
- [ ] Call to `convertUsdCentsToLocal()` in `createManualPaymentIntent` (line ~479)

**Update**:

- [ ] `createManualPaymentIntent` handler: Remove currency conversion logic
- [ ] Always use `args.amountCents` directly (no conversion)
- [ ] Always use `"usd"` as currency (let Stripe handle conversion)
- [ ] OR: Pass detected currency but let Stripe handle the amount conversion

**Decision Point**:

- Option A: Always charge in USD, let card issuer handle conversion
- Option B: Charge in detected currency, but let Stripe determine the amount (requires Stripe's FX Quotes API)

**Recommendation**: Start with Option A (simpler, removes all conversion code)

#### Task 2.2: Remove Hardcoded Rates from `src/lib/currency.ts`

**File**: `src/lib/currency.ts`

**Keep**:

- ✅ `SupportedCurrency` type
- ✅ `CurrencyInfo` interface (but remove `usdRate` field)
- ✅ `CURRENCIES` object (but remove `usdRate` from each currency)
- ✅ `detectUserCurrency()` function
- ✅ `detectUserCountry()` function
- ✅ `formatCurrency()` function
- ✅ `getCurrencyInfo()` function
- ✅ `isSupportedCurrency()` function

**Remove**:

- [ ] `usdRate` field from `CurrencyInfo` interface
- [ ] `usdRate` values from `CURRENCIES` object
- [ ] `convertUsdToLocalCents()` function (lines ~184-190)
- [ ] `convertLocalToUsdCents()` function (lines ~195-201)
- [ ] All comments mentioning "exchange rate" or "fallback rates"

**Update**:

- [ ] Update `CurrencyInfo` interface to remove `usdRate`
- [ ] Update `CURRENCIES` object to remove all `usdRate` properties
- [ ] Update file header comment to remove mention of exchange rates

#### Task 2.3: Update Frontend Usage - SubmitClient.tsx

**File**: `src/app/[slug]/submit/SubmitClient.tsx`

**Current Dependencies** (lines 10, 248-262, 550-558):

- Line 10: imports `convertUsdToLocalCents` (not actually used - can remove)
- Lines 248-253: passes `detectedCurrency` to `createManualPaymentIntent`
- Lines 255-262: receives `chargeAmountCents` and `chargeCurrency` from backend, stores them
- Lines 550-558: passes these to `PaymentWrapper`

**Remove**:

- [ ] Import of `convertUsdToLocalCents` from `@/lib/currency` (line 10)
- [ ] `detectedCurrency` state variable and detection useEffect (lines 59-72) - not needed for USD-only display
- [ ] `chargeAmountCents` and `chargeCurrency` state variables (lines 61-62)
- [ ] Logic that stores backend return values (lines 261-262)

**Update**:

- [ ] Call `createManualPaymentIntent` with only: `{ creatorSlug, ticketRef, amountCents: form.priorityTipCents }`
- [ ] Pass to `PaymentWrapper`: `amountCents={form.priorityTipCents}` and `currency="usd"` directly
- [ ] Remove `originalUsdCents` prop (redundant since we're in USD)

#### Task 2.4: Update Frontend Usage - PaymentWrapper.tsx

**File**: `src/components/checkout/PaymentWrapper.tsx`

**Current Behavior** (lines 29-56):

- Shows conversion info if `currency !== "usd"`
- Displays both charge amount and original USD amount
- Uses `formatCurrency` to display amounts

**What Breaks with Plan**:

- The component expects `chargeAmountCents` and `chargeCurrency` from backend
- The `showConversionInfo` logic will never trigger if we always pass `"usd"`
- The `originalUsdCents` prop becomes redundant

**Remove**:

- [ ] `originalUsdCents` prop from interface and function signature (lines 18, 27)
- [ ] `showConversionInfo` logic (line 30)
- [ ] Conversion display block (lines 51-55)

**Update**:

- [ ] Simplify amount display to always show USD
- [ ] Keep `amountCents` and `currency` props (for `CheckoutForm`)
- [ ] Always expect `currency="usd"`

---

### Phase 3: Simplify Payment Flow

#### Task 3.1: Update `createManualPaymentIntent` Handler

**File**: `convex/payments.ts`

**Current** (lines 455-538):

```typescript
export const createManualPaymentIntent = action({
  args: {
    creatorSlug: v.string(),
    ticketRef: v.string(),
    amountCents: v.number(), // Always in USD cents (display currency)
    currency: v.optional(v.string()), // Target currency for charging (e.g., "mxn")
  },
  handler: async (ctx, args) => {
    // ... gets creator ...

    // Determine the charging currency and convert amount
    const chargeCurrency = (args.currency ?? "usd").toLowerCase();
    const chargeAmountCents =
      chargeCurrency === "usd"
        ? args.amountCents
        : convertUsdCentsToLocal(args.amountCents, chargeCurrency);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmountCents,
      currency: chargeCurrency,
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      metadata: {
        creatorSlug: args.creatorSlug,
        ticketRef: args.ticketRef,
        originalUsdCents: String(args.amountCents),
        chargeCurrency,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      chargeAmountCents,
      chargeCurrency,
    };
  },
});
```

**Updated**:

```typescript
export const createManualPaymentIntent = action({
  args: {
    creatorSlug: v.string(),
    ticketRef: v.string(),
    amountCents: v.number(), // Always in USD cents
  },
  handler: async (ctx, args) => {
    if (args.amountCents <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const creator = await ctx.runQuery(api.dashboard.getCreator, {
      creatorSlug: args.creatorSlug,
    });

    if (!creator || !creator.stripeAccountId) {
      throw new Error("Creator does not have a connected Stripe account");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amountCents, // USD amount directly
      currency: "usd", // Always charge in USD
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      on_behalf_of: creator.stripeAccountId, // KEY FIX: Associate with connected account
      metadata: {
        creatorSlug: args.creatorSlug,
        ticketRef: args.ticketRef,
      },
    });

    await ctx.runMutation(api.payments.setPaymentIntentForTicket, {
      ticketRef: args.ticketRef,
      paymentIntentId: paymentIntent.id,
      status: "pending",
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  },
});
```

**Changes**:

- [ ] Remove `currency` arg (not needed - always USD)
- [ ] Remove `convertUsdCentsToLocal()` call
- [ ] Remove `chargeCurrency` and `chargeAmountCents` variables
- [ ] Always use `amount: args.amountCents` and `currency: "usd"`
- [ ] Add `on_behalf_of: creator.stripeAccountId`
- [ ] Remove `chargeCurrency` and `originalUsdCents` from metadata
- [ ] Simplify return to only `clientSecret` and `paymentIntentId`

---

### Phase 4: Testing & Verification

#### Task 4.1: Test Manual Capture Flow

- [ ] Create PaymentIntent with `on_behalf_of`
- [ ] Verify PaymentIntent is created successfully
- [ ] Verify PaymentIntent has `status: "requires_capture"`
- [ ] Verify `capturePaymentForTicket` still works
- [ ] Verify funds are captured to platform account (not connected account)
- [ ] Verify webhook events fire correctly

#### Task 4.2: Test International Cards

- [ ] Test with Mexican card (MXN)
- [ ] Test with European card (EUR)
- [ ] Test with Canadian card (CAD)
- [ ] Test with other international cards
- [ ] Verify all cards are accepted

#### Task 4.3: Test Currency Display

- [ ] Verify currency detection still works
- [ ] Verify amounts display correctly in user's currency
- [ ] Verify no conversion errors in console

#### Task 4.4: Test Transfer Flow

- [ ] Verify `scheduleMonthlyPayouts` still works
- [ ] Verify `stripe.transfers.create` still works
- [ ] Verify transfers go to correct connected account

---

## Files to Modify

### Critical Changes (Must Do)

1. **`convex/payments.ts`**
   - Add `on_behalf_of` to PaymentIntent creation (line ~500)
   - Remove `CURRENCY_USD_RATES` constant (lines ~434-443)
   - Remove `convertUsdCentsToLocal()` function (lines ~449-452)
   - Remove conversion logic from `createManualPaymentIntent` (lines ~476-479)
   - Simplify `createManualPaymentIntent` args (remove `currency`)
   - Simplify return (remove `chargeAmountCents`, `chargeCurrency`)

2. **`src/lib/currency.ts`**
   - Remove `usdRate` from `CurrencyInfo` interface (line 27)
   - Remove `usdRate` from `CURRENCIES` object (lines 33-40)
   - Remove `convertUsdToLocalCents()` function (lines ~184-190)
   - Remove `convertLocalToUsdCents()` function (lines ~195-201)
   - Update header comment to remove mention of exchange rates

### Frontend Updates (Must Do)

3. **`src/app/[slug]/submit/SubmitClient.tsx`**
   - Remove import of `convertUsdToLocalCents` (line 10)
   - Remove `detectedCurrency` state and detection (lines 59-72)
   - Remove `chargeAmountCents` and `chargeCurrency` state (lines 61-62)
   - Remove backend return value usage (lines 261-262)
   - Pass `amountCents={form.priorityTipCents}` and `currency="usd"` to PaymentWrapper

4. **`src/components/checkout/PaymentWrapper.tsx`**
   - Remove `originalUsdCents` prop (line 18)
   - Remove `showConversionInfo` logic (line 30)
   - Remove conversion display block (lines 51-55)
   - Simplify to always display USD amount

### Other Files to Check (Optional)

5. **`src/components/checkout/CheckoutForm.tsx`** - Verify it doesn't depend on conversion
6. **Any other files importing from `@/lib/currency`** - Verify no conversion functions used

---

## Rollback Plan

If issues occur:

1. Remove `on_behalf_of` parameter (revert Task 1.1)
2. Restore hardcoded rates temporarily
3. Investigate issue
4. Re-apply fix with adjustments

---

## Success Criteria

- [ ] PaymentIntents created with `on_behalf_of` parameter
- [ ] PaymentIntents created with `currency: "usd"` (no conversion)
- [ ] Manual capture still works (funds stay on platform account)
- [ ] International cards accepted globally (MXN, EUR, CAD, etc.)
- [ ] All hardcoded currency rates removed from `convex/payments.ts`
- [ ] All hardcoded currency rates removed from `src/lib/currency.ts`
- [ ] All conversion functions removed (`convertUsdCentsToLocal`, `convertUsdToLocalCents`, `convertLocalToUsdCents`)
- [ ] Frontend displays USD amounts only
- [ ] PaymentWrapper simplified (no conversion display)
- [ ] Transfer flow still works (`stripe.transfers.create`)
- [ ] No console errors related to currency conversion
- [ ] Webhook events fire correctly

---

## Notes

- **Manual capture is NON-NEGOTIABLE**: Any change that breaks manual capture will be rejected
- **Global solution**: This fix applies to ALL currencies, not just MXN or specific regions
- **Stripe handles conversion**: We're removing our hardcoded rates and letting Stripe handle FX natively
- **USD-only display**: The app shows amounts in dollars only; Stripe handles currency conversion behind the scenes
- **No webhook changes needed**: Webhooks use PaymentIntent directly from Stripe API, not our return values
- **Root cause**: The hardcoded conversion was attempting to fix the wrong problem. Real fix is using `on_behalf_of` correctly.

---

## Implementation Order

1. **FIRST**: Add `on_behalf_of` (Task 3.1) - This fixes the core currency acceptance issue
2. **THEN**: Remove hardcoded rates (Task 2.1, 2.2) - Cleanup the idiotic hardcoded code
3. **FINALLY**: Update frontend (Task 2.3, 2.4) - Simplify to USD-only display
4. **TEST**: Verify everything works (Phase 4)

**DO NOT** remove hardcoded rates before adding `on_behalf_of` - we need to fix the core issue first.
