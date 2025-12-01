# Pre-Launch Alpha Plan

## 1. Security & Multi-Tenancy Verification
**Objective**: Ensure strict data isolation between tenants.
- [x] **URL Isolation**: Verify `user A` cannot access `user B`'s dashboard simply by changing the URL slug.
- [x] **Query Auditing**: Ensure all Convex queries filter strictly by the *authenticated* user's identity (Clerk ID), not just the `slug` passed in the URL.
- [x] **Action Verification**: Test edge cases where a user might try to perform actions (approve/reject) on tickets belonging to another creator.

## 2. Payment & Brand Polish
**Objective**: Professionalize the payment flow and remove placeholder branding.
- [x] **Stripe Branding**: Configure Stripe Dashboard settings to display "Please Please Please" instead of default/test names.
- [x] **Payment Flow**: Verify the "Authorize Now, Capture Later" flow is robust and handles errors gracefully.
- [x] **De-branding**: Remove any "HAND" branding or generic placeholders from the UI.

## 3. Onboarding "Zero to One"
**Objective**: Ensure a seamless first-run experience for new creators.
- [x] **Signup Flow**: Test the end-to-end flow for a brand new user signing up via Clerk.
- [x] **Data Initialization**: Verify that a `Creator` record is automatically created in Convex upon signup.
- [x] **Default State**: Ensure default queues and settings are correctly initialized so the user doesn't land on a broken dashboard.
- [] **Creator Intro Task**: Add a default "tutorial" task: It should be set for pending approval and as a way for new users to get started with the platform.

## 4. Codebase Cleanup
**Objective**: Reduce technical debt and confusion.
- [x] **Archive Demo**: Archive or remove the `src/app/demo` directory to prevent confusion with the production `[slug]` routes.
- [x] **Dead Code**: Identify and remove unused mock data or prototype components.

## 5. Identity & Profile Management (Clerk vs. Convex)
**Context**:
- The app currently uses `user.firstName` for greetings (e.g., "Signed in as [Name]").
- The app uses `user.username` for URL routing (e.g., `pleasex3.com/[username]`).
- This discrepancy can be confusing for users who might expect their display name to match their URL or vice versa.

**Proposed Solution**:
- [x] **Sidebar Update**: Replace the "My Skills" button in the dashboard sidebar with a **"My Account"** button.
- [x] **My Account View**: Create a simple view/modal that displays:
    - **Username**: The slug used for their public URL (e.g., `pleasex3.com/alex`).
    - **Display Name**: The name used for greetings and emails (e.g., "Alejandro").
- [ ] **Future Editing**: Plan for functionality to allow users to edit these fields, ensuring changes sync correctly between Clerk and Convex and handle unique constraints.

## 6. Stripe Onboarding & Monetization Logic
**Context**:
- [x] New creators start without a connected Stripe account.
- [x] We want to encourage them to connect Stripe to monetize, but the system must work (for free) without it.

**Proposed Solution**:
- [x] **Monetization Banner**: Create a global top bar component (visible on dashboard pages) for creators who haven't connected Stripe yet.
    - **Message**: "Start Monetizing your time, connect [Stripe Link]"
    - **Action**: Redirects to `dashboard/earnings` (or directly to Stripe Connect flow).
- [x] **"Free Mode" Logic**:
    - **Public Queue Page (`/[slug]`)**: If creator has no Stripe account, replace any pricing/tipping display with a "FREE" badge/text.
    - **Submit Page (`/[slug]/submit`)**:
        - Disable/Hide the tipping component.
        - Show "FREE" indicator.
        - Ensure the submit mutation handles "0 tip" tickets correctly without attempting Stripe charges.

**Priority queue default price fix**
- [x] When a new account gets created and stripe set-up, the priority queue does not display the default price of $50 until the creator manually adjusts the price in the queue settings on the dashboard. Fix this.


**Create terms of service page**
- [ ] Create a terms of service page and link to it from the about modal.


## 7. -[x] Paid submission fix: When tips are added, the tickets are being submitted before the payment intent is created, so even if a user cancels the payment flow, the ticket is still created. Fix this

## 8. -[ ] Deleting user flashing screen. 
- Currently, after deleting a user, the dashboard screen flashes an "error reading dashboard" before redirecting to the home page. Instead of having the flash "error reading dashboard" the text should be "User deleted successfully" and the user should be redirected to the home page.