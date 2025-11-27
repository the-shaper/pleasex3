# Please Please Please

A creator queue management system for handling personal and priority favor requests with Stripe payments.

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Convex (database + serverless functions)
- **Styling**: Tailwind CSS v4
- **Auth**: Clerk
- **Payments**: Stripe (authorize now, capture later)
- **Email**: Resend + React Email

## Getting Started

### Prerequisites

- Node.js 18+
- Convex account
- Clerk account
- Stripe account
- Resend account (optional for emails)

### Installation

```bash
# Install dependencies
pnpm install

# Set up Convex
npx convex dev

# Run development server
pnpm dev
```

### Environment Variables

#### Convex Environment Variables
Set these via `npx convex env set`:

```bash
npx convex env set STRIPE_API_KEY sk_...
npx convex env set STRIPE_WEBHOOK_SECRET whsec_...
npx convex env set RESEND_API_KEY re_...
npx convex env set RESEND_FROM_EMAIL noreply@yourdomain.com
```

#### Next.js Environment Variables
Create a `.env.local` file:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Stripe Webhook Setup (Development)

Run Stripe CLI to forward webhooks to your Convex backend:

```bash
stripe listen --forward-to https://your-deployment.convex.site/stripe
```

Copy the webhook signing secret and set it in Convex:

```bash
npx convex env set STRIPE_WEBHOOK_SECRET whsec_...
```

## Core Features

- **Dual Queue System**: Personal (free) and Priority (paid) queues
- **3:1 Queue Ratio**: Priority tickets processed 3x faster than personal
- **Payment Flow**: Stripe "authorize now, capture later" for creator approval
- **Real-time Updates**: Live queue positions and ticket status
- **Creator Dashboard**: Approve/reject tickets, manage queues, view earnings
- **Email Notifications**: Automated emails for ticket receipts, approvals, and rejections

## Key Workflows

### Ticket Submission Flow

1. User visits `/{creatorSlug}/submit`
2. Fills out ticket form (name, email, task description)
3. Selects queue type (personal or priority)
4. If priority, enters payment via Stripe
5. Stripe authorizes payment (holds funds)
6. Webhook marks ticket as `open` → appears in creator dashboard
7. User receives receipt email

### Ticket Approval Flow

1. Creator sees ticket in "Pending Approvals" panel
2. Reviews ticket details
3. Approves → Stripe captures payment, ticket moves to queue
4. Rejects → Stripe cancels/refunds payment
5. User receives approval/rejection email

## Data Model

### Core Tables

- **creators**: Creator profiles, Stripe account IDs, queue settings
- **tickets**: Ticket submissions with status, payment info, queue assignments
- **queues**: Queue metrics (active count, ETA, enabled status)
- **payments**: Payment records from Stripe
- **payouts**: Monthly payout calculations

### Ticket Statuses

- `pending_payment`: Payment being processed
- `open`: Awaiting creator approval
- `approved`: In queue, being worked on
- `closed`: Completed
- `rejected`: Declined by creator

## Queue Algorithm

The main queue uses a 3:1 priority:personal ratio:

1. Separate approved tickets by queue type
2. Interleave: 3 priority tickets, then 1 personal ticket
3. Maintain FIFO order within each type
4. Dynamically recalculate positions on status changes

## Deployment

### Development

```bash
npx convex dev
pnpm dev
```

### Production

```bash
# Deploy Convex backend
npx convex deploy --prod

# Build and deploy Next.js
pnpm build
pnpm start
```

### Stripe Webhook (Production)

Configure webhook endpoint in Stripe Dashboard:
- URL: `https://your-deployment.convex.site/stripe`
- Events: `payment_intent.amount_capturable_updated`, `payment_intent.succeeded`

## Project Structure

```
src/
├── app/
│   ├── [slug]/          # Creator pages
│   │   ├── dashboard/   # Creator dashboard
│   │   └── submit/      # Ticket submission
│   └── api/             # Next.js API routes
├── components/          # React components
│   ├── dashboard/       # Dashboard components
│   └── checkout/        # Payment components
└── lib/                 # Utilities and types

convex/
├── schema.ts            # Database schema
├── tickets.ts           # Ticket mutations/queries
├── payments.ts          # Stripe payment actions
├── http.ts              # Stripe webhook handler
├── emails.ts            # Email sending actions
└── lib/
    └── ticketEngine.ts  # Queue algorithm
```

## Known Issues & Limitations

- **Resend Dev Mode**: Free tier only sends to verified emails. Verify a domain for production.
- **Stripe Test Mode**: Use test cards for development (e.g., `4242 4242 4242 4242`)

## License

[Add your license information here]
