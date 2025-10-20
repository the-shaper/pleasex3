# UI Components Migration Strategy

## Overview

This document outlines the strategy for migrating the UI components from the Supabase/Postgres backend to Convex. The migration focuses on replacing API calls with Convex queries and mutations while maintaining the existing UI functionality and styling.

## Component Migration Mapping

### 1. QueueCard.tsx

**Current Implementation:**

- Receives queue data as props
- Manages tip amount with local state
- Uses Next.js Link for navigation

**Migration Strategy:**

- Replace prop-based data with Convex query
- Keep local state management for tip amount
- Update navigation to use Next.js App Router
- Maintain existing styling and layout

**Required Changes:**

```typescript
// Before
interface QueueCardProps {
  kind: QueueKind;
  slug: string;
  data: {
    activeTurn: number | null;
    nextTurn: number;
    etaMins: number | null;
    enabled: boolean;
  };
  minPriorityTipCents: number;
}

// After
interface QueueCardProps {
  kind: QueueKind;
  creatorId: Id<"creators">;
  minPriorityTipCents: number;
}

// Add Convex query
const queueData = useQuery(api.queues.getQueueState, {
  creatorId,
  queueType: kind,
});
```

### 2. SubmitClient.tsx

**Current Implementation:**

- Fetches initial queue data from API
- Submits form via POST to /api/tickets
- Uses useSearchParams for initial values

**Migration Strategy:**

- Replace fetch with Convex query for initial data
- Replace form submission with Convex mutation
- Keep useSearchParams for URL state
- Maintain form validation and error handling

**Required Changes:**

```typescript
// Before
const res = await fetch("/api/tickets", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({...}),
});

// After
const submitTicket = useMutation(api.tickets.submitTicket);
const result = await submitTicket({
  creatorId,
  queue,
  name: form.name,
  email: form.email,
  // ... other fields
});
```

### 3. TicketApprovalCard.tsx

**Current Implementation:**

- Receives ticket as prop
- Approves/rejects via API endpoints
- Uses window.location.reload() for refresh

**Migration Strategy:**

- Keep prop-based ticket data
- Replace API calls with Convex mutations
- Replace page reload with optimistic updates
- Maintain loading states and error handling

**Required Changes:**

```typescript
// Before
const res = await fetch(
  `/api/tickets/${encodeURIComponent(ticket.ref)}/approve`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }
);

// After
const approveTicket = useMutation(api.tickets.approveTicket);
await approveTicket({ ticketId: ticket.id });
```

### 4. submit-page.tsx (Server Component)

**Current Implementation:**

- Fetches queue data from API
- Passes data to SubmitClient

**Migration Strategy:**

- Replace API fetch with Convex query
- Keep server component pattern
- Maintain error handling for missing data

**Required Changes:**

```typescript
// Before
const res = await fetch(
  `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/creators/${slug}/queue`,
  { next: { revalidate: 5 } }
);
const initialQueue = res.ok ? await res.json() : null;

// After
const initialQueue = await convex.query(api.queues.getCreatorQueueState, {
  slug,
});
```

### 5. globals.css

**Current Implementation:**

- Custom CSS variables and Tailwind configuration
- Font definitions and color palette

**Migration Strategy:**

- No changes needed
- Keep all existing styles
- Ensure Tailwind v4 compatibility

### 6. loading.tsx

**Current Implementation:**

- Skeleton loading states
- Tailwind-based styling

**Migration Strategy:**

- No changes needed
- Keep existing loading states

### 7. page.tsx (Creator Landing Page)

**Current Implementation:**

- Basic Next.js landing page

**Migration Strategy:**

- Complete rewrite needed
- Implement creator queue display
- Add QueueCard components
- Fetch creator data via Convex

## File Structure After Migration

```
src/
├── app/
│   ├── [slug]/
│   │   ├── page.tsx          # Creator page with queues
│   │   ├── submit/
│   │   │   └── page.tsx      # Submit page wrapper
│   │   └── loading.tsx       # Loading state
│   ├── status/
│   │   └── [ref]/
│   │       └── page.tsx      # Ticket status page
│   ├── dashboard/
│   │   └── [slug]/
│   │       └── page.tsx      # Creator dashboard
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── QueueCard.tsx
│   ├── SubmitClient.tsx
│   └── TicketApprovalCard.tsx
└── lib/
    └── convex.ts             # Convex client setup
```

## Convex Integration Points

### 1. Client Setup

```typescript
// src/lib/convex.ts
import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);
```

### 2. Provider Setup

```typescript
// src/app/layout.tsx
import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ConvexProvider client={convex}>{children}</ConvexProvider>
      </body>
    </html>
  );
}
```

### 3. Component Patterns

- Use `useQuery` for data fetching
- Use `useMutation` for data updates
- Implement optimistic updates where appropriate
- Handle loading and error states consistently

## Migration Steps

1. **Setup Convex Integration**

   - Install and configure Convex client
   - Add ConvexProvider to layout
   - Create basic schema and functions

2. **Migrate Simple Components**

   - Start with QueueCard (data display only)
   - Test data fetching and display

3. **Migrate Form Components**

   - Update SubmitClient with mutations
   - Implement form validation
   - Add error handling

4. **Migrate Dashboard Components**

   - Update TicketApprovalCard
   - Implement real-time updates
   - Add optimistic updates

5. **Create Server Components**

   - Update submit-page.tsx
   - Create creator page
   - Create status page

6. **Testing and Refinement**
   - Test all user flows
   - Optimize performance
   - Add error boundaries

## Considerations

### Performance

- Implement proper loading states
- Use Convex subscriptions for real-time updates
- Optimize queries to avoid over-fetching

### Error Handling

- Implement consistent error patterns
- Add user-friendly error messages
- Handle network failures gracefully

### Accessibility

- Maintain existing accessibility features
- Add proper ARIA labels for dynamic content
- Ensure keyboard navigation works

### Styling

- Keep all existing styles
- Ensure Tailwind v4 compatibility
- Maintain responsive design
