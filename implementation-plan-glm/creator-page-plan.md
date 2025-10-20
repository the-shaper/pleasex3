# Creator Page Implementation Plan

## Overview

The creator page is the main landing page for a creator's queue system, accessible at `/{slug}`. It displays two queue cards (personal and priority) with real-time information about queue status, wait times, and allows users to claim tickets.

## File Structure

```
src/app/[slug]/
├── page.tsx              # Main creator page
├── loading.tsx           # Loading state
└── not-found.tsx         # 404 page
```

## Component Architecture

### 1. Creator Page (src/app/[slug]/page.tsx)

**Purpose:** Server component that fetches creator data and renders queue cards.

**Data Requirements:**

- Creator information (name, slug, minimum tip)
- Queue state for both personal and priority queues
- Real-time updates for queue metrics

**Implementation:**

```typescript
// src/app/[slug]/page.tsx
import { notFound } from "next/navigation";
import { QueueCard } from "@/components/QueueCard";
import { getCreatorBySlug, getCreatorQueueState } from "@/convex/queries";

interface CreatorPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { slug } = await params;

  // Fetch creator data
  const creator = await getCreatorBySlug({ slug });
  if (!creator) {
    notFound();
  }

  // Fetch queue state
  const queueState = await getCreatorQueueState({ creatorId: creator._id });

  return (
    <div className="min-h-screen bg-bg">
      <header className="p-6 text-center">
        <h1 className="text-4xl font-bold text-text mb-2">
          NEED A QUICK FAVOR FROM {creator.displayName.toUpperCase()}
        </h1>
        <p className="text-text-muted">
          Choose between Personal and Priority queues
        </p>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <QueueCard
          kind="personal"
          creatorId={creator._id}
          data={queueState.personalQueue}
          minPriorityTipCents={creator.minPriorityTipCents}
        />

        <QueueCard
          kind="priority"
          creatorId={creator._id}
          data={queueState.priorityQueue}
          minPriorityTipCents={creator.minPriorityTipCents}
        />
      </main>
    </div>
  );
}
```

### 2. QueueCard Component (src/components/QueueCard.tsx)

**Purpose:** Client component that displays queue information and allows users to select tip amounts.

**Key Features:**

- Display current turn, next available, and ETA
- Interactive tip amount selector
- Link to submission page with pre-filled parameters
- Real-time updates for queue metrics

**Migration Steps:**

1. **Update Props Interface:**

```typescript
interface QueueCardProps {
  kind: QueueKind;
  creatorId: Id<"creators">;
  data: QueueState;
  minPriorityTipCents: number;
}
```

2. **Add Convex Query:**

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/api";

export default function QueueCard({
  kind,
  creatorId,
  data,
  minPriorityTipCents,
}: QueueCardProps) {
  const queueData = useQuery(api.queues.getQueueState, {
    creatorId,
    queueType: kind,
  });

  // Use real-time data or fallback to server data
  const currentData = queueData || data;
}
```

3. **Update Navigation:**

```typescript
const claimHref = useMemo(() => {
  const base = `/${slug}/submit?queue=${kind}`;
  if (isPriority || tipCents > 0) {
    return `${base}&tipCents=${tipCents}`;
  }
  return base;
}, [slug, kind, tipCents, isPriority]);
```

4. **Add Real-time Subscriptions:**

```typescript
// Subscribe to queue updates
const queueState = useQuery(api.queues.getCreatorQueueState, { creatorId });
```

### 3. Loading State (src/app/[slug]/loading.tsx)

**Purpose:** Skeleton loading state while fetching creator and queue data.

**Implementation:**

```typescript
// src/app/[slug]/loading.tsx
export default function CreatorPageLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="p-6 text-center">
        <div className="h-12 w-96 bg-slate-200 rounded mb-2 mx-auto" />
        <div className="h-6 w-64 bg-slate-200 rounded mx-auto" />
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
            <div className="h-8 w-32 bg-slate-200 rounded mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-32 bg-slate-200 rounded" />
                <div className="h-20 bg-slate-200 rounded" />
              </div>
              <div className="space-y-4">
                <div className="h-24 bg-slate-200 rounded" />
                <div className="h-16 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
```

### 4. Not Found Page (src/app/[slug]/not-found.tsx)

**Purpose:** Custom 404 page for non-existent creators.

**Implementation:**

```typescript
// src/app/[slug]/not-found.tsx
import Link from "next/link";

export default function CreatorNotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-text mb-4">Creator Not Found</h1>
        <p className="text-text-muted mb-8">
          The creator you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
```

## Data Flow

1. **Page Load:**

   - Server component fetches creator by slug
   - Server component fetches queue state
   - QueueCard components render with initial data

2. **Real-time Updates:**

   - QueueCard subscribes to queue state changes
   - UI updates automatically when queue metrics change
   - Tip amount selection is handled locally

3. **Navigation:**
   - User selects tip amount (optional)
   - User clicks "Claim Ticket" button
   - Navigate to submit page with query parameters

## Styling Considerations

1. **Responsive Design:**

   - Mobile-first approach
   - Stacked layout on mobile
   - Side-by-side layout on larger screens

2. **Accessibility:**

   - Semantic HTML structure
   - ARIA labels for interactive elements
   - Keyboard navigation support

3. **Visual Hierarchy:**
   - Clear distinction between personal and priority queues
   - Prominent call-to-action buttons
   - Clear pricing information

## Error Handling

1. **Creator Not Found:**

   - Display custom 404 page
   - Provide navigation back to home

2. **Queue Not Available:**

   - Show "Currently closed" message
   - Disable claim button
   - Display estimated reopening time if available

3. **Network Issues:**
   - Fallback to server-rendered data
   - Display connection status indicator
   - Retry failed requests

## Performance Optimizations

1. **Server-side Rendering:**

   - Initial data fetched on server
   - Immediate page display
   - SEO optimization

2. **Client-side Updates:**

   - Subscribe to specific data changes
   - Avoid unnecessary re-renders
   - Optimize query patterns

3. **Code Splitting:**
   - Lazy load heavy components
   - Dynamic imports for non-critical features
   - Optimize bundle size

## Testing Strategy

1. **Unit Tests:**

   - QueueCard component behavior
   - Tip amount calculations
   - Link generation

2. **Integration Tests:**

   - Complete user flow
   - Real-time updates
   - Error scenarios

3. **E2E Tests:**
   - Page load performance
   - Mobile responsiveness
   - Accessibility compliance
