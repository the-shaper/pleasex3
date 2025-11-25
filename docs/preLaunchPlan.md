# Pre-Launch Alpha Plan

## 1. Security & Multi-Tenancy Verification
**Objective**: Ensure strict data isolation between tenants.
- [ ] **URL Isolation**: Verify `user A` cannot access `user B`'s dashboard simply by changing the URL slug.
- [ ] **Query Auditing**: Ensure all Convex queries filter strictly by the *authenticated* user's identity (Clerk ID), not just the `slug` passed in the URL.
- [ ] **Action Verification**: Test edge cases where a user might try to perform actions (approve/reject) on tickets belonging to another creator.

## 2. Payment & Brand Polish
**Objective**: Professionalize the payment flow and remove placeholder branding.
- [ ] **Stripe Branding**: Configure Stripe Dashboard settings to display "Please Please Please" instead of default/test names.
- [ ] **Payment Flow**: Verify the "Authorize Now, Capture Later" flow is robust and handles errors gracefully.
- [ ] **De-branding**: Remove any "HAND" branding or generic placeholders from the UI.

## 3. Onboarding "Zero to One"
**Objective**: Ensure a seamless first-run experience for new creators.
- [ ] **Signup Flow**: Test the end-to-end flow for a brand new user signing up via Clerk.
- [ ] **Data Initialization**: Verify that a `Creator` record is automatically created in Convex upon signup.
- [ ] **Default State**: Ensure default queues and settings are correctly initialized so the user doesn't land on a broken dashboard.

## 4. Codebase Cleanup
**Objective**: Reduce technical debt and confusion.
- [ ] **Archive Demo**: Archive or remove the `src/app/demo` directory to prevent confusion with the production `[slug]` routes.
- [ ] **Dead Code**: Identify and remove unused mock data or prototype components.

## 5. Identity & Profile Management (Clerk vs. Convex)
**Context**:
- The app currently uses `user.firstName` for greetings (e.g., "Signed in as [Name]").
- The app uses `user.username` for URL routing (e.g., `pleasex3.com/[username]`).
- This discrepancy can be confusing for users who might expect their display name to match their URL or vice versa.

**Proposed Solution**:
- [ ] **Sidebar Update**: Replace the "My Skills" button in the dashboard sidebar with a **"My Account"** button.
- [ ] **My Account View**: Create a simple view/modal that displays:
    - **Username**: The slug used for their public URL (e.g., `pleasex3.com/ale`).
    - **Display Name**: The name used for greetings and emails (e.g., "Alejandro").
- [ ] **Future Editing**: Plan for functionality to allow users to edit these fields, ensuring changes sync correctly between Clerk and Convex and handle unique constraints.

## 6. Stripe Onboarding & Monetization Logic
**Context**:
- New creators start without a connected Stripe account.
- We want to encourage them to connect Stripe to monetize, but the system must work (for free) without it.

**Proposed Solution**:
- [ ] **Monetization Banner**: Create a global top bar component (visible on dashboard pages) for creators who haven't connected Stripe yet.
    - **Message**: "Start Monetizing your time, connect [Stripe Link]"
    - **Action**: Redirects to `dashboard/earnings` (or directly to Stripe Connect flow).
- [ ] **"Free Mode" Logic**:
    - **Public Queue Page (`/[slug]`)**: If creator has no Stripe account, replace any pricing/tipping display with a "FREE" badge/text.
    - **Submit Page (`/[slug]/submit`)**:
        - Disable/Hide the tipping component.
        - Show "FREE" indicator.
        - Ensure the submit mutation handles "0 tip" tickets correctly without attempting Stripe charges.
