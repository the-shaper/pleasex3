# Creator Dashboard Implementation Plan

## Overview

The creator dashboard is the management interface for freelancers to review, approve, reject, and track ticket submissions. It provides filtering capabilities, queue overview, and detailed ticket management.

## File Structure

```
src/app/dashboard/[slug]/
├── page.tsx                    # Main dashboard page
├── loading.tsx                 # Loading state
└── components/
    ├── DashboardTabs.tsx       # Tab navigation
    ├── TicketList.tsx          # Filterable ticket list
    ├── QueueStats.tsx          # Queue statistics
    └── TicketDetail.tsx        # Expanded ticket view
```

## Component Architecture

### 1. Dashboard Page (src/app/dashboard/[slug]/page.tsx)

**Purpose:** Server component that handles authentication and fetches initial data.

**Data Requirements:**

- Creator information and authentication
- Initial ticket data for all tabs
- Queue statistics

**Implementation:**

```typescript
// src/app/dashboard/[slug]/page.tsx
import { notFound, redirect } from "next/navigation";
import { getCreatorBySlug } from "@/convex/queries";
import { DashboardClient } from "@/components/DashboardClient";
import { auth } from "@/lib/auth"; // To be implemented with Clerk

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;

  // Authentication check (to be implemented with Clerk)
  const session = await auth();
  if (!session || session.user.slug !== slug) {
    redirect(`/login?redirect=/dashboard/${slug}`);
  }

  // Fetch creator data
  const creator = await getCreatorBySlug({ slug });
  if (!creator) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg">
      <DashboardClient creatorId={creator._id} creator={creator} />
    </div>
  );
}
```

### 2. Dashboard Client (src/components/DashboardClient.tsx)

**Purpose:** Client component that manages dashboard state and real-time updates.

**Key Features:**

- Tab navigation between ticket views
- Real-time ticket updates
- Filtering and search functionality
- Queue statistics display

**Implementation:**

```typescript
// src/components/DashboardClient.tsx
"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/api";
import { DashboardTabs } from "./DashboardTabs";
import { TicketList } from "./TicketList";
import { QueueStats } from "./QueueStats";

interface DashboardClientProps {
  creatorId: Id<"creators">;
  creator: Creator;
}

export function DashboardClient({ creatorId, creator }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"new" | "approved" | "all">("new");
  const [filter, setFilter] = useState<{
    queueType?: "personal" | "priority";
    searchTerm?: string;
  }>({});

  // Real-time data subscriptions
  const pendingTickets = useQuery(api.tickets.getTicketsByCreator, {
    creatorId,
    status: "pending",
    ...filter,
  });

  const approvedTickets = useQuery(api.tickets.getTicketsByCreator, {
    creatorId,
    status: "approved",
    ...filter,
  });

  const allTickets = useQuery(api.tickets.getTicketsByCreator, {
    creatorId,
    ...filter,
  });

  const queueState = useQuery(api.queues.getCreatorQueueState, { creatorId });

  const getTicketsForTab = () => {
    switch (activeTab) {
      case "new":
        return pendingTickets || [];
      case "approved":
        return approvedTickets || [];
      case "all":
        return allTickets || [];
      default:
        return [];
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">
          {creator.displayName} Dashboard
        </h1>
        <p className="text-text-muted">Manage your favor requests and queue</p>
      </header>

      <QueueStats queueState={queueState} />

      <DashboardTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filter={filter}
        onFilterChange={setFilter}
        ticketCounts={{
          new: pendingTickets?.length || 0,
          approved: approvedTickets?.length || 0,
          all: allTickets?.length || 0,
        }}
      />

      <TicketList
        tickets={getTicketsForTab()}
        activeTab={activeTab}
        creatorId={creatorId}
      />
    </div>
  );
}
```

### 3. Dashboard Tabs (src/components/DashboardTabs.tsx)

**Purpose:** Tab navigation and filtering controls.

**Implementation:**

```typescript
// src/components/DashboardTabs.tsx
interface DashboardTabsProps {
  activeTab: "new" | "approved" | "all";
  onTabChange: (tab: "new" | "approved" | "all") => void;
  filter: {
    queueType?: "personal" | "priority";
    searchTerm?: string;
  };
  onFilterChange: (filter: any) => void;
  ticketCounts: {
    new: number;
    approved: number;
    all: number;
  };
}

export function DashboardTabs({
  activeTab,
  onTabChange,
  filter,
  onFilterChange,
  ticketCounts,
}: DashboardTabsProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-subtle">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "new"
              ? "text-coral border-b-2 border-coral"
              : "text-text-muted hover:text-text"
          }`}
          onClick={() => onTabChange("new")}
        >
          New Submissions {ticketCounts.new > 0 && `(${ticketCounts.new})`}
        </button>

        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "approved"
              ? "text-coral border-b-2 border-coral"
              : "text-text-muted hover:text-text"
          }`}
          onClick={() => onTabChange("approved")}
        >
          Approved {ticketCounts.approved > 0 && `(${ticketCounts.approved})`}
        </button>

        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "all"
              ? "text-coral border-b-2 border-coral"
              : "text-text-muted hover:text-text"
          }`}
          onClick={() => onTabChange("all")}
        >
          All Tickets {ticketCounts.all > 0 && `(${ticketCounts.all})`}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={filter.queueType || ""}
          onChange={(e) =>
            onFilterChange({
              ...filter,
              queueType: e.target.value as "personal" | "priority" | undefined,
            })
          }
          className="px-3 py-2 border border-gray-subtle rounded bg-bg text-text"
        >
          <option value="">All Types</option>
          <option value="personal">Personal</option>
          <option value="priority">Priority</option>
        </select>

        <input
          type="text"
          placeholder="Search by name or email..."
          value={filter.searchTerm || ""}
          onChange={(e) =>
            onFilterChange({
              ...filter,
              searchTerm: e.target.value,
            })
          }
          className="px-3 py-2 border border-gray-subtle rounded bg-bg text-text flex-1 max-w-md"
        />
      </div>
    </div>
  );
}
```

### 4. Queue Stats (src/components/QueueStats.tsx)

**Purpose:** Display queue statistics and metrics.

**Implementation:**

```typescript
// src/components/QueueStats.tsx
interface QueueStatsProps {
  queueState: QueueState | null | undefined;
}

export function QueueStats({ queueState }: QueueStatsProps) {
  if (!queueState) {
    return <div className="animate-pulse">Loading queue statistics...</div>;
  }

  const { personalQueue, priorityQueue } = queueState;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div className="bg-greenlite p-4 rounded-lg">
        <h3 className="font-bold text-text mb-2">Personal Queue</h3>
        <div className="space-y-1 text-sm">
          <div>Active: {personalQueue.activeCount}</div>
          <div>Next Turn: {personalQueue.nextTurn}</div>
          <div>ETA: {formatEta(personalQueue.etaMins)}</div>
          <div>Status: {personalQueue.enabled ? "Open" : "Closed"}</div>
        </div>
      </div>

      <div className="bg-gold p-4 rounded-lg">
        <h3 className="font-bold text-text mb-2">Priority Queue</h3>
        <div className="space-y-1 text-sm">
          <div>Active: {priorityQueue.activeCount}</div>
          <div>Next Turn: {priorityQueue.nextTurn}</div>
          <div>ETA: {formatEta(priorityQueue.etaMins)}</div>
          <div>Status: {priorityQueue.enabled ? "Open" : "Closed"}</div>
        </div>
      </div>
    </div>
  );
}

function formatEta(etaMins: number | null): string {
  if (!etaMins) return "—";
  if (etaMins < 60) return `${etaMins}m`;
  const hours = Math.round(etaMins / 60);
  return `${hours}h`;
}
```

### 5. Ticket List (src/components/TicketList.tsx)

**Purpose:** Display list of tickets with approval/reject actions.

**Implementation:**

```typescript
// src/components/TicketList.tsx
import { TicketApprovalCard } from "./TicketApprovalCard";
import { TicketDetail } from "./TicketDetail";

interface TicketListProps {
  tickets: Ticket[];
  activeTab: "new" | "approved" | "all";
  creatorId: Id<"creators">;
}

export function TicketList({ tickets, activeTab, creatorId }: TicketListProps) {
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        No tickets found for this filter.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div key={ticket._id}>
          {activeTab === "new" ? (
            <TicketApprovalCard
              ticket={ticket}
              onExpand={() =>
                setExpandedTicket(
                  expandedTicket === ticket._id ? null : ticket._id
                )
              }
            />
          ) : (
            <TicketDetail
              ticket={ticket}
              isExpanded={expandedTicket === ticket._id}
              onExpand={() =>
                setExpandedTicket(
                  expandedTicket === ticket._id ? null : ticket._id
                )
              }
              creatorId={creatorId}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

### 6. Ticket Detail (src/components/TicketDetail.tsx)

**Purpose:** Expanded view of approved and completed tickets.

**Implementation:**

```typescript
// src/components/TicketDetail.tsx
interface TicketDetailProps {
  ticket: Ticket;
  isExpanded: boolean;
  onExpand: () => void;
  creatorId: Id<"creators">;
}

export function TicketDetail({
  ticket,
  isExpanded,
  onExpand,
  creatorId,
}: TicketDetailProps) {
  const completeTicket = useMutation(api.tickets.completeTicket);
  const [isCompleting, setIsCompleting] = useState(false);

  async function handleComplete() {
    setIsCompleting(true);
    try {
      await completeTicket({ ticketId: ticket._id });
    } catch (error) {
      alert("Failed to complete ticket");
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-sm">{ticket.referenceNumber}</div>
            <div className="text-sm text-gray-500">
              {ticket.queueType.toUpperCase()} • Tip $
              {(ticket.priorityTipCents / 100).toFixed(2)}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(ticket.submittedAt).toLocaleString()}
          </div>
        </div>

        <div className="mt-2 font-semibold">
          {ticket.name} <span className="text-gray-500">({ticket.email})</span>
        </div>

        <div className="mt-2 text-sm whitespace-pre-wrap">
          {ticket.needText}
        </div>

        <button
          onClick={onExpand}
          className="mt-3 text-sm text-coral hover:underline"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {ticket.phone && (
              <div>
                <span className="font-semibold">Phone:</span> {ticket.phone}
              </div>
            )}
            {ticket.location && (
              <div>
                <span className="font-semibold">Location:</span>{" "}
                {ticket.location}
              </div>
            )}
            {ticket.social && (
              <div>
                <span className="font-semibold">Social:</span> {ticket.social}
              </div>
            )}
            <div>
              <span className="font-semibold">Status:</span> {ticket.status}
            </div>
          </div>

          {ticket.attachments.length > 0 && (
            <div className="mt-4">
              <div className="font-semibold text-sm mb-2">Attachments:</div>
              <div className="space-y-1">
                {ticket.attachments.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-coral hover:underline truncate"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {ticket.status === "approved" && (
            <div className="mt-4">
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="px-4 py-2 bg-blue text-white rounded hover:bg-blue-600 disabled:opacity-60"
              >
                {isCompleting ? "Completing..." : "Mark as Completed"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Data Flow

1. **Dashboard Load:**

   - Authentication check
   - Fetch creator data
   - Initialize real-time subscriptions

2. **Tab Navigation:**

   - Switch between ticket views
   - Apply filters
   - Update displayed tickets

3. **Ticket Actions:**

   - Approve/reject pending tickets
   - Complete approved tickets
   - Real-time UI updates

4. **Search and Filter:**
   - Client-side filtering
   - Server-side search (future)
   - Debounced input handling

## Authentication

### Protection Strategy

1. **Server-side Check:**

   - Verify user session
   - Check slug ownership
   - Redirect if unauthorized

2. **Client-side Check:**
   - Validate user permissions
   - Show appropriate UI
   - Handle session expiration

### Future Integration with Clerk

```typescript
// src/lib/auth.ts
import { auth } from "@clerk/nextjs/server";

export async function auth() {
  const { userId } = await auth();
  if (!userId) return null;

  // Fetch user from Convex
  const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
  return user;
}
```

## Performance Optimizations

1. **Real-time Updates:**

   - Subscribe only to necessary data
   - Batch updates when possible
   - Optimize query patterns

2. **List Rendering:**

   - Virtualization for large lists
   - Efficient re-rendering
   - Memoized components

3. **Search and Filter:**
   - Debounced search input
   - Efficient filtering algorithms
   - Cached filter results

## Mobile Responsiveness

1. **Layout Adaptation:**

   - Stacked layout on mobile
   - Collapsible filters
   - Touch-friendly interactions

2. **Card Design:**
   - Swipeable actions (future)
   - Expandable details
   - Clear visual hierarchy

## Error Handling

1. **Network Issues:**

   - Show connection status
   - Retry failed requests
   - Preserve local state

2. **Permission Errors:**

   - Redirect to login
   - Show helpful messages
   - Clear sensitive data

3. **Data Corruption:**
   - Validation checks
   - Fallback displays
   - Error reporting
