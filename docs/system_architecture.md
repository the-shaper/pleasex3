# System Architecture

## High-Level Overview

This diagram shows the major components of the "Please Please Please" application and how they interact.

```mermaid
graph TD
    User["User / Fan"]
    Creator[Creator]
    
    subgraph Frontend["Frontend (Next.js)"]
        SubmitPage[Submit Page]
        Dashboard[Creator Dashboard]
        PublicPage[Public Queue Page]
    end
    
    subgraph Backend["Backend (Convex)"]
        TicketEngine["Ticket Engine (Queue Logic)"]
        StripeEngine["Stripe Engine (Financials)"]
        DB[("Convex DB")]
        
        DB --> TicketEngine
        DB --> StripeEngine
    end
    
    subgraph External["External Services"]
        Stripe[Stripe Payments]
        Resend[Resend Emails]
    end

    User -->|Submits Ticket| SubmitPage
    SubmitPage -->|Personal (Free)| DB
    SubmitPage -->|Priority (Paid)| Stripe
    Stripe -->|Webhook| DB
    
    Creator -->|Approves/Rejects| Dashboard
    Dashboard -->|Mutations| DB
    
    DB -->|Realtime Updates| PublicPage
    DB -->|Realtime Updates| Dashboard
    
    TicketEngine -->|Calculates Order| Dashboard
    TicketEngine -->|Calculates Order| PublicPage
    
    StripeEngine -->|Calculates Earnings| Dashboard
```

## Payment & Ticket Lifecycle (v3 Flow)

 This sequence diagram illustrates the "Authorize Now, Capture Later" flow.

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend (Submit)
    participant S as Stripe
    participant C as Convex (Backend)
    participant D as Dashboard (Creator)

    Note over U, D: 1. Submission Phase
    U->>FE: Fills form & Card Details
    FE->>S: Confirm PaymentIntent (manual_capture)
    S-->>FE: Success (Requires Capture)
    FE->>C: Mutation: createTicket (pending_payment)
    
    par Async Webhook
        S->>C: Webhook: amount_capturable_updated
        C->>C: markAsOpen(ticketRef)
    end
    
    Note over U, D: 2. Approval Phase
    C-->>D: Realtime Update (New Request)
    D->>C: Mutation: approveTicket(ticketRef)
    C->>S: Stripe API: capture(paymentIntentId)
    S-->>C: Capture Success
    C->>C: assignTicketNumber()
    C->>C: markAsApproved()
    
    par Async Webhook
        S->>C: Webhook: payment_intent.succeeded
        C->>C: recordPayment(payments table)
    end
    
    C-->>U: Email: Ticket Approved
    C-->>D: Update Earnings & Queue
```

## Ticket Engine Logic (3:1 Ratio)

This diagram explains how the `ticketEngine` prioritizes tickets using the 3:1 Interleaving algorithm.

```mermaid
stateDiagram-v2
    state "Approved Tickets" as Approved {
        state "Priority Queue" as PQ
        state "Personal Queue" as PerQ
    }
    
    state "Scheduling Engine" as Engine {
        state "3 Priority" as 3P
        state "1 Personal" as 1P
        
        [*] --> 3P
        3P --> 1P : After 3 served
        1P --> 3P : After 1 served
    }
    
    PQ --> Engine : Feed
    PerQ --> Engine : Feed
    
    state "Output" as Out {
        state "Current (Active)" as Curr
        state "Next Up" as Next
        state "Pending List" as Pend
    }
    
    Engine --> Out : Determines
```

## Database Schema Relations

Simplified view of the core data models in Convex.

```mermaid
erDiagram
    CREATORS ||--o{ TICKETS : "receives"
    CREATORS ||--o{ PAYMENTS : "earns"
    CREATORS ||--o{ PAYOUTS : "paid via"
    CREATORS ||--o{ QUEUES : "has"
    CREATORS ||--|| COUNTERS : "has"
    
    TICKETS {
        string _id
        string ref "Unique reference"
        string status "pending_payment, open, approved, rejected, closed"
        string queueKind "personal, priority"
        int ticketNumber "Global monotonic"
        int queueNumber "Queue monotonic"
        string paymentIntentId
        string paymentStatus "requires_capture, succeeded, canceled, refunded"
    }
    
    PAYMENTS {
        string _id
        string ticketRef
        string externalId "Stripe PaymentIntent ID"
        int amountGross
        int stripeFeeCents
        int netCents
        string status "succeeded, refunded"
    }
    
    QUEUES {
        string _id
        string creatorSlug
        string kind "personal, priority"
        int activeTurn
        int nextTurn
        int etaDays
        int activeCount
        bool enabled
    }
    
    COUNTERS {
        string _id
        string creatorSlug
        int nextTicketNumber
        int nextPersonalNumber
        int nextPriorityNumber
    }
    
    PAYOUTS {
        string _id
        string creatorSlug
        int periodStart
        int periodEnd
        int grossCents
        int platformFeeCents
        int payoutCents
        string status "pending, processing, paid, failed"
    }

    TICKETS ||--|| PAYMENTS : "associated with"
```
