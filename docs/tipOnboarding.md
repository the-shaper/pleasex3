# Tipping Onboarding Guide

## Purpose

- Let creators optionally accept voluntary tips on their personal queue.
- Default state: tipping is OFF. It can only be turned ON after Stripe onboarding is complete.

## Prerequisites

- Stripe account created via Earnings tab.
- Stripe onboarding completed (`stripeAccountId` set and `payoutEnabled` true). Until then, the tipping toggle is disabled.

## How to enable tipping

1. Go to `/{your-slug}/dashboard?tab=queue-settings`.
2. In the Personal section, find **Enable Tipping**.
3. Connect Stripe if prompted (button links to Earnings).
4. Toggle **ON**. This writes `tippingEnabled=true` for the personal queue.

## What users see

- Public page (`/{slug}`): the tip amount row on the Personal card is hidden when tipping is off; shown when on. Priority card is unchanged.
- Submit flow (`/{slug}/submit`): the donation component is hidden when tipping is off; shown when on. Tip values are forced to $0 when off.

## Troubleshooting

- Toggle is disabled: finish Stripe onboarding in Earnings (needs both account + payouts enabled).
- Tip UI still visible after turning OFF: wait for Convex cache propagation or refresh; the UI reads `tippingEnabled` from the latest snapshot.







