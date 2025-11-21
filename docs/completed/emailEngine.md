# Email Engine Plan

## Objective
Implement a reliable email notification system for both Creators and Users using **Resend**.

## Provider
**Resend** (via `resend` SDK).
- API Key: `RESEND_API_KEY` (env var).
- Sender Identity: `notifications@pleasex3.com` (or similar verified domain).

## Use Cases & Triggers

### 1. Creator Onboarding
- **Trigger**: Creator creates a Please Please Please account.
- **Recipient**: Creator.
- **Goal**: Welcome them, encourage Stripe connection.

### 2. Stripe Connection
- **Trigger**: Creator successfully connects Stripe account.
- **Recipient**: Creator.
- **Goal**: Confirm they are ready to receive payments.

### 3. Payout Ready
- **Trigger**: Monthly payout calculation is complete (Admin triggers).
- **Recipient**: Creator.
- **Goal**: Notify them that funds are on the way.

### 4. Ticket Created (User Receipt)
- **Trigger**: User submits a ticket (and pays if applicable).
- **Recipient**: User.
- **Goal**: Confirm receipt, provide Reference Number, link to tracking.
- **Template Data**:
    - `user_name`
    - `ticket_ref` (e.g., "ALESSANDRI-PPP-123")
    - `tracking_url` (e.g., `pleasex3.com/tracking/ALESSANDRI-PPP-123`)
    - `creator_name`

### 5. Ticket Created (Creator Alert)
- **Trigger**: User submits a ticket.
- **Recipient**: Creator.
- **Goal**: Alert them of a new request pending approval.
- **Template Data**:
    - `creator_name`
    - `user_name`
    - `ticket_type` (Personal/Priority)
    - `tip_amount` (if any)
    - `dashboard_url`

### 6. Ticket Approved
- **Trigger**: Creator clicks "Approve" in dashboard.
- **Recipient**: User.
- **Goal**: Notify that work has started, provide Queue Number.
- **Template Data**:
    - `user_name`
    - `ticket_ref`
    - `queue_number` (e.g., "You are #3 in the queue")
    - `estimated_wait_time` (optional, from ETA engine)

### 7. Ticket Rejected
- **Trigger**: Creator clicks "Reject" in dashboard.
- **Recipient**: User.
- **Goal**: Notify of rejection and refund initiation.
- **Template Data**:
    - `user_name`
    - `ticket_ref`
    - `creator_name`
    - `refund_status` (e.g., "Your hold has been released")

## Implementation Strategy
1.  **Setup**: Install `resend` package. Configure API key.
2.  **Templates**: Create React Email templates (or simple HTML strings initially) for each use case.
3.  **Convex Integration**:
    - Create internal actions in `convex/emails.ts` (e.g., `sendTicketCreatedEmail`).
    - Call these actions from existing mutations/actions (e.g., inside `createTicket`, `approveTicket`).

## Email Template Design
- **Style**: Minimalist, matching the "Please Please Please" aesthetic (Using Space Mono -open source google fonts– if unavailable, use Courier font, simple layout).
- **Content**:
    - Header: "Please Please Please" logo/text.
    - Body: Clear status update.
    - Call to Action: Link to Tracking or Dashboard.
    - Footer: "Provided by Twilight Fringe".
