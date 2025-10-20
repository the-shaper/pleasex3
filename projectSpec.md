## Needs

### Queueing dynamics

- There are two queues: "personal" and "priority"
- Each queue, priority and personal have their own ticket numbering.
- Personal favors are "free" or have donations lesser than $50usd
- Priority favors have donations of $50 or above
- Favor submissions get put "on hold" until the main user approves
- Favors queue automatically by ticket number, from oldest to newest
- There should be a "main queue" where all favors (personal + priority) are shown in the pipeline.
- In the "main queue" the ordering pattern of favors are queued is: 3/1 — 3 priority favors to 1 personal favor.

### Dashboard essentials

- Show new submissions
  - Approve
  - Reject
- Show approved submissions
  - Pending
  - Finished
- Show all submissions

- Filter by:
  - Type
    - Personal
    - Priority
  - Request Number
  - Next-in-Line

### Submission Cards (favor items)

- Personal / Priority
- Submission date (requested on)
- Submitted by ("Friend Name")
- Friend's e-mail (from which they submitted)
- Task description
- Links (provided by Friend)
- Tracking Number (Submission Key)
- Donated amount 

## Additional Requirements

### Queue Numbering System

- Each creator has their own separate numbering for personal and priority queues
- Each creator has their own separate numbering for the main queue

### Approval Workflow

- When a favor is approved, it automatically gets added to the "main queue" with the 3:1 priority:personal ratio
- No separate step needed for adding to main queue

### Next-in-Line Status

- Calculated dynamically based on the current queue position

### Dashboard Access

- Only the creator/freelancer will access the dashboard
- No different permission levels needed initially

### Notifications

- Basic notification system planned but not a priority for initial implementation
- Should include notifications for ticket approval, rejection, and queue position changes

## Data Model Requirements

### Creator

- Unique identifier
- Display name
- Slug (for URL routing)
- Minimum priority tip amount (in cents)
- Queue settings (enabled/disabled for each queue type)

### Ticket

- Unique reference/identifier
- Creator ID (foreign key)
- Queue type (personal/priority)
- Status (pending/approved/rejected/completed)
- Submission details:
  - Name
  - Email
  - Phone (optional)
  - Location (optional)
  - Social (optional)
  - Task description
  - Attachments/links
- Tip amount (in cents)
- Consent for email communication
- Timestamps:
  - Submitted at
  - Approved at
  - Completed at

### Queue State

- For each creator:
  - Personal queue: active turn, next turn, active count, ETA
  - Priority queue: active turn, next turn, active count, ETA
  - Main queue: ordered list of approved tickets

## API Requirements

### Public Endpoints

- GET /{slug} - Creator page with queue cards
- GET /{slug}/submit - Ticket submission form
- POST /api/tickets - Submit new ticket
- GET /status/{ref} - Check ticket status

### Creator-Only Endpoints

- GET /dashboard/{slug} - Creator dashboard
- POST /api/tickets/{ref}/approve - Approve ticket
- POST /api/tickets/{ref}/reject - Reject ticket
- POST /api/tickets/{ref}/complete - Mark ticket as completed
- GET /api/creators/{slug}/queue - Get queue state

## Technical Implementation Notes

### Frontend

- Next.js 15 with App Router
- Tailwind CSS for styling
- Custom CSS variables for theming
- Client components for interactive elements
- Server components for data fetching

### Backend

- Convex for database and serverless functions
- Real-time updates for queue positions
- No external database needed
- Authentication planned with Clerk (future implementation)

### UI Components to Migrate

- QueueCard.tsx - Display queue information
- SubmitClient.tsx - Ticket submission form
- TicketApprovalCard.tsx - Dashboard approval interface
- loading.tsx - Loading states
- page.tsx - Marketing/creator landing page
- submit-page.tsx - Server wrapper for submission form
- globals.css - Global styles and theme
