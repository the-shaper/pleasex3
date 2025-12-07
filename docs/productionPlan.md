# Production Deployment Plan

> **Status**: In Progress  
> **Domain**: `pleasepleaseplease.me`  
> **Last Updated**: December 4, 2024

---

## Current Status

| Service                 | Status                  | Notes                                 |
| ----------------------- | ----------------------- | ------------------------------------- |
| **Vercel**              | ✅ Deployed             | Custom domain linked                  |
| **Convex (Production)** | ✅ Environment vars set | See verified vars below               |
| **Clerk**               | ✅ Deployed             | OAuth google provider set – test mode |
| **Stripe**              | ⚠️ Needs verification   | Webhook endpoint needs updating       |
| **Resend**              | ⚠️ Needs verification   | Domain verification status unknown    |

---

## 🚨 Critical Issue: OAuth Redirect Errors

**Problem**: Getting "Error 400: invalid_request" with `flowName=GeneralOAuthFlow` when clicking OAuth providers.

**Root Cause**: The Convex `auth.config.ts` is still pointing to the **development** Clerk domain:

```typescript
// convex/auth.config.ts (CURRENT - BROKEN)
export default {
  providers: [
    {
      domain: "https://trusted-sawfly-28.clerk.accounts.dev", // ❌ DEV domain
      applicationID: "convex",
    },
  ],
};
```

**Fix Required**: Update to production Clerk domain:

```typescript
// convex/auth.config.ts (REQUIRED)
export default {
  providers: [
    {
      domain: "https://clerk.pleasepleaseplease.me", // ✅ PROD domain
      applicationID: "convex",
    },
  ],
};
```

---

## Production Environment Variables

### Verified in Convex Dashboard ✅

From your screenshot, these are already set:

| Variable                  | Value                                 | Status                      |
| ------------------------- | ------------------------------------- | --------------------------- |
| `CLERK_JWT_ISSUER_DOMAIN` | `https://clerk.pleasepleaseplease.me` | ✅                          |
| `CLERK_SECRET_KEY`        | `sk_live_pl8kxh9fc...`                | ✅                          |
| `NEXT_PUBLIC_SITE_URL`    | `https://pleasepleaseplease.me`       | ✅                          |
| `RESEND_API_KEY`          | `re_bCKqZ3At_Kj...`                   | ✅                          |
| `STRIPE_API_KEY`          | `sk_live_51064fl...`                  | ✅                          |
| `STRIPE_WEBHOOK_SECRET`   | `whsec_QyWOb8fyLix...`                | ✅ (Updated for production) |

### Verified in Vercel Dashboard ✅

From your screenshot, these are already set:

| Variable                            | Value                               | Status |
| ----------------------------------- | ----------------------------------- | ------ |
| `STRIPE_API_KEY`                    | `sk_live_51064fl...`                | ✅     |
| `STRIPE_WEBHOOK_SECRET`             | `whsec_09a0d9dec...`                | ✅     |
| `NEXT_PUBLIC_CONVEX_URL`            | `https://tremendous-terrier-593...` | ✅     |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_Y2xlcmsuc...`              | ✅     |
| `CLERK_SECRET_KEY`                  | `sk_live_pl8kxh9fc...`              | ✅     |

---

## Action Items Checklist

### Phase 1: Fix Critical Issues (Priority: 🔴 HIGH)

- [x] **1.1 - Update Convex auth.config.ts** ✅ DONE
  - Changed Clerk domain from dev to production
  - Deployed to Convex production: `npx convex deploy --yes`
  - File: [auth.config.ts](file:///Users/HAND/Documents/a/Dev/pleasex3/convex/auth.config.ts)

- [x] **1.2 - Configure Clerk OAuth Redirect URLs** ✅ DONE
  - Configured Google OAuth in Clerk Production Instance
  - Apple OAuth disabled for now (future enhancement)
  - Google sign-in/sign-up working successfully

- [x] **1.3 - Configure OAuth Provider Consoles** ✅ DONE (Google only)
  - **Google Cloud Console**: Added authorized redirect URI: `https://clerk.pleasepleaseplease.me/v1/oauth_callback`
  - **Apple OAuth**: Skipped for now (see Future Enhancements below)

### Phase 2: Webhook Configuration (Priority: 🟠 MEDIUM)

- [x] **2.1 - Create Production Stripe Webhook** ✅ DONE
  - Created endpoint: `https://tremendous-terrier-593.convex.cloud/stripe`
  - Subscribed to events: `payment_intent.succeeded`, `payment_intent.amount_capturable_updated`, `account.updated`
  - Updated `STRIPE_WEBHOOK_SECRET` in both Convex and Vercel
  - Added missing `NEXT_PUBLIC_SITE_URL` to Convex production

- [ ] **2.2 - Complete Stripe Connect Platform Profile** 🔴 REQUIRED
  - **Error**: "You must complete your platform profile to use Connect and create live connected accounts"
  - Go to [Stripe Dashboard → Connect → Settings](https://dashboard.stripe.com/connect/accounts/overview)
  - Complete the platform profile questionnaire
  - Answer questions about:
    - Your business model
    - How you use Connect
    - What services your connected accounts provide
    - Compliance/regulatory information
  - **Note**: This is a one-time setup required for production (not needed in test mode)

- [ ] **2.3 - Verify Stripe Connect Branding**
  - In Stripe Dashboard → Settings → Connect settings
  - Ensure your production redirect URLs are configured
  - Verify branding settings are set to "Please Please Please"

### Phase 3: Email/DNS Configuration (Priority: 🟡 MEDIUM)

- [ ] **3.1 - Verify Resend Domain**
  - Go to [Resend Dashboard](https://resend.com/domains)
  - Verify domain `pleasepleaseplease.me` is properly configured
  - Check DNS records (SPF, DKIM, DMARC) are properly set

- [ ] **3.2 - Verify Clerk DNS Configuration**
  - Confirm `clerk.pleasepleaseplease.me` CNAME is pointed to Clerk
  - Should be: `frontend-api.clerk.dev`

### Phase 4: Verification & Testing (Priority: 🟢 REQUIRED)

- [ ] **4.1 - Test OAuth Sign-in Flow**
  - Open `https://pleasepleaseplease.me` in incognito
  - Click sign in → Try Google OAuth
  - Verify successful authentication and redirect

- [ ] **4.2 - Test Sign-up Flow**
  - Create a new test account
  - Verify:
    - Creator record is created in Convex
    - Default "tutorial" ticket appears
    - Redirect to dashboard works

- [ ] **4.3 - Test Payment Flow (with Test Mode first)**
  - Create a test ticket with payment
  - Verify Stripe authorization works
  - Verify webhook triggers `payment_intent.amount_capturable_updated`

- [ ] **4.4 - Test Email Delivery**
  - Trigger a test email (e.g., ticket notification)
  - Verify email arrives and looks correct

---

## Production URLs Reference

| Service                    | URL                                                     |
| -------------------------- | ------------------------------------------------------- |
| **App**                    | `https://pleasepleaseplease.me`                         |
| **Clerk**                  | `https://clerk.pleasepleaseplease.me`                   |
| **Convex Dashboard**       | `https://dashboard.convex.dev/d/tremendous-terrier-593` |
| **Convex HTTP (Webhooks)** | `https://tremendous-terrier-593.convex.cloud/stripe`    |

---

## Next Steps After This Plan

Once production deployment is stable:

1. **PostHog Integration** (from preLaunchPlan.md #12)
2. **Terms of Service Page** (from preLaunchPlan.md #6.76)
3. **Fix "Deleting user" flash screen** (from preLaunchPlan.md #8)
4. **Stripe Connect check improvement** (from preLaunchPlan.md #10)
5. **Release of Funds automation** (from preLaunchPlan.md #11)

---

## Future Enhancements

### OAuth Improvements

- [ ] **Google OAuth App Verification**
  - Currently in "Test" mode (limited to test users)
  - After thorough testing, submit for Google verification
  - [Google OAuth Verification Guide](https://support.google.com/cloud/answer/9110914)
  - Required for public access without warnings

- [ ] **Apple Sign-In Integration**
  - Set up Apple Developer account credentials
  - Configure Apple OAuth in Clerk Dashboard
  - Add authorized domains in Apple Developer Console

---

## Detailed OAuth Setup Guide

### Google OAuth Setup (Completed ✅)

This guide is for reference if you need to set up OAuth for another environment or provider.

#### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Name**: "Please Please Please - Production"
   - **Authorized redirect URIs**: Add `https://clerk.pleasepleaseplease.me/v1/oauth_callback`
6. Click **Create** and save your **Client ID** and **Client Secret**

#### 2. Clerk Dashboard Configuration

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your **Production** instance (check dropdown at top-left)
3. Navigate to **User & Authentication → Social Connections**
4. Click on **Google**
5. Toggle **Enable for sign-up and sign-in**
6. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
7. Click **Save**

#### 3. Testing

1. Open your app in incognito: `https://pleasepleaseplease.me`
2. Click "Sign in with Google"
3. Verify successful authentication and redirect

#### 4. Google App Verification (Future)

When ready for public launch:

1. Go to Google Cloud Console → OAuth consent screen
2. Click **Publish App** (moves from Testing to Production)
3. Submit for verification if needed (required for >100 users)
4. Provide:
   - App homepage
   - Privacy policy URL
   - Terms of service URL
   - Authorized domains

### Apple OAuth Setup (Future)

When ready to add Apple Sign-In:

#### 1. Apple Developer Console

1. Go to [Apple Developer](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a **Services ID**
4. Configure:
   - **Domains**: `pleasepleaseplease.me`
   - **Return URLs**: `https://clerk.pleasepleaseplease.me/v1/oauth_callback`
5. Create a **Key** for Sign in with Apple
6. Download the key file (.p8)

#### 2. Clerk Dashboard

1. Go to **User & Authentication → Social Connections → Apple**
2. Enable Apple
3. Enter:
   - **Services ID**
   - **Team ID**
   - **Key ID**
   - **Private Key** (contents of .p8 file)
4. Save

---

## Troubleshooting

### OAuth still failing after updates?

1. Clear browser cache and cookies
2. Try incognito mode
3. Check Clerk Dashboard → Logs for detailed errors
4. Verify the JWT template in Clerk includes `convex` audience

### Convex queries failing?

1. Verify `CLERK_JWT_ISSUER_DOMAIN` matches your Clerk production domain exactly
2. Re-run `npx convex deploy` after auth.config.ts changes
3. Check Convex logs for JWT validation errors

### Stripe webhooks not firing?

1. Go to Stripe Dashboard → Developers → Webhooks → Recent Deliveries
2. Look for failed delivery attempts
3. Verify webhook secret matches exactly

---

LAST BUT NOT LEAST

- [ ] **Create "HOW?" section in modal.** Explain Px3 in 3 steps.
