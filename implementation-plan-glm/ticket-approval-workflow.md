# Ticket Approval Workflow Implementation Plan

## Overview

The ticket approval workflow is a critical component that allows creators to review pending submissions, approve or reject them, and manage their queue effectively. This workflow includes real-time updates, optimistic UI updates, and proper error handling.

## Component Architecture

### 1. TicketApprovalCard Component (src/components/TicketApprovalCard.tsx)

**Purpose:** Display pending tickets with approve/reject actions.

**Key Features:**

- Display ticket details in a compact format
- Quick approve/reject actions
- Loading states during operations
- Optimistic updates for better UX
- Error handling and retry mechanisms

**Migration from Original:**

```typescript
// src/components/TicketApprovalCard.tsx
"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/api";

interface TicketApprovalCardProps {
  ticket: Ticket;
  onExpand?: () => void;
  onActionComplete?: () => void;
}

export function TicketApprovalCard({
  ticket,
  onExpand,
  onActionComplete,
}: TicketApprovalCardProps) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const approveTicket = useMutation(api.tickets.approveTicket);
  const rejectTicket = useMutation(api.tickets.rejectTicket);

  async function handleApprove() {
    setLoading("approve");
    setMessage(null);

    try {
      await approveTicket({ ticketId: ticket._id });
      setMessage("Approved successfully!");

      // Notify parent component to refresh data
      if (onActionComplete) {
        onActionComplete();
      }

      // Clear message after delay
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("reject");
    setMessage(null);

    try {
      await rejectTicket({ ticketId: ticket._id });
      setMessage("Rejected successfully!");

      // Notify parent component to refresh data
      if (onActionComplete) {
        onActionComplete();
      }

      // Clear message after delay
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rejection failed");
    } finally {
      setLoading(null);
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

        {onExpand && (
          <button
            onClick={onExpand}
            className="mt-3 text-sm text-coral hover:underline"
          >
            View Details
          </button>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading === "approve" ? "Approving..." : "Approve"}
          </button>

          <button
            onClick={handleReject}
            disabled={loading !== null}
            className="px-4 py-2 bg-slate-200 text-gray-800 rounded hover:bg-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading === "reject" ? "Rejecting..." : "Reject"}
          </button>
        </div>

        {message && (
          <div
            className={`mt-2 text-sm ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. Approval Actions Hook (src/hooks/useApprovalActions.ts)

**Purpose:** Custom hook to manage approval workflow with optimistic updates.

```typescript
// src/hooks/useApprovalActions.ts
import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/api";

interface UseApprovalActionsProps {
  onActionComplete?: () => void;
}

export function useApprovalActions({
  onActionComplete,
}: UseApprovalActionsProps = {}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const approveTicket = useMutation(api.tickets.approveTicket);
  const rejectTicket = useMutation(api.tickets.rejectTicket);

  const handleApprove = useCallback(
    async (ticketId: string) => {
      setLoading(ticketId);
      setErrors((prev) => ({ ...prev, [ticketId]: "" }));

      try {
        await approveTicket({ ticketId });
        if (onActionComplete) {
          onActionComplete();
        }
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Approval failed";
        setErrors((prev) => ({ ...prev, [ticketId]: errorMessage }));
        return false;
      } finally {
        setLoading(null);
      }
    },
    [approveTicket, onActionComplete]
  );

  const handleReject = useCallback(
    async (ticketId: string) => {
      setLoading(ticketId);
      setErrors((prev) => ({ ...prev, [ticketId]: "" }));

      try {
        await rejectTicket({ ticketId });
        if (onActionComplete) {
          onActionComplete();
        }
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Rejection failed";
        setErrors((prev) => ({ ...prev, [ticketId]: errorMessage }));
        return false;
      } finally {
        setLoading(null);
      }
    },
    [rejectTicket, onActionComplete]
  );

  return {
    approve: handleApprove,
    reject: handleReject,
    loading,
    errors,
  };
}
```

### 3. Optimistic Updates (src/hooks/useOptimisticUpdates.ts)

**Purpose:** Hook to manage optimistic updates for better user experience.

```typescript
// src/hooks/useOptimisticUpdates.ts
import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/api";

export function useOptimisticUpdates(creatorId: string) {
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Record<string, any>
  >({});

  // Real-time data
  const tickets =
    useQuery(api.tickets.getTicketsByCreator, {
      creatorId,
      status: "pending",
    }) || [];

  // Apply optimistic updates to real data
  const ticketsWithOptimistic = tickets.map((ticket) => {
    const update = optimisticUpdates[ticket._id];
    if (update) {
      return { ...ticket, ...update };
    }
    return ticket;
  });

  const applyOptimisticUpdate = useCallback((ticketId: string, update: any) => {
    setOptimisticUpdates((prev) => ({
      ...prev,
      [ticketId]: update,
    }));

    // Clear optimistic update after delay
    setTimeout(() => {
      setOptimisticUpdates((prev) => {
        const { [ticketId]: _, ...rest } = prev;
        return rest;
      });
    }, 5000);
  }, []);

  return {
    tickets: ticketsWithOptimistic,
    applyOptimisticUpdate,
  };
}
```

### 4. Batch Approval Component (src/components/BatchApproval.tsx)

**Purpose:** Allow bulk approval/rejection of tickets.

```typescript
// src/components/BatchApproval.tsx
"use client";
import { useState } from "react";
import { useApprovalActions } from "@/hooks/useApprovalActions";

interface BatchApprovalProps {
  tickets: Ticket[];
  onActionComplete?: () => void;
}

export function BatchApproval({
  tickets,
  onActionComplete,
}: BatchApprovalProps) {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { approve, reject, loading, errors } = useApprovalActions({
    onActionComplete,
  });

  const handleSelectAll = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map((t) => t._id));
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleBatchApprove = async () => {
    setIsProcessing(true);

    for (const ticketId of selectedTickets) {
      await approve(ticketId);
    }

    setSelectedTickets([]);
    setIsProcessing(false);
  };

  const handleBatchReject = async () => {
    setIsProcessing(true);

    for (const ticketId of selectedTickets) {
      await reject(ticketId);
    }

    setSelectedTickets([]);
    setIsProcessing(false);
  };

  if (tickets.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTickets.length === tickets.length}
              onChange={handleSelectAll}
              className="rounded"
            />
            Select All ({selectedTickets.length} selected)
          </label>
        </div>

        {selectedTickets.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleBatchApprove}
              disabled={isProcessing}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-60"
            >
              {isProcessing
                ? "Processing..."
                : `Approve ${selectedTickets.length}`}
            </button>

            <button
              onClick={handleBatchReject}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-200 text-gray-800 rounded hover:bg-slate-300 disabled:opacity-60"
            >
              {isProcessing
                ? "Processing..."
                : `Reject ${selectedTickets.length}`}
            </button>
          </div>
        )}
      </div>

      {Object.values(errors).some((error) => error) && (
        <div className="mt-2 text-sm text-red-600">
          Some actions failed. Please check individual tickets for details.
        </div>
      )}
    </div>
  );
}
```

## Workflow States

### 1. Initial State

- Tickets displayed with "pending" status
- Approve/Reject buttons enabled
- No loading indicators

### 2. Action Initiated

- Loading state on specific button
- Button disabled during operation
- Other actions remain available

### 3. Success State

- Success message displayed
- Ticket removed from pending list
- Queue metrics updated automatically

### 4. Error State

- Error message displayed
- Button re-enabled
- Option to retry action

## Real-time Updates

### 1. Queue State Updates

```typescript
// Subscribe to queue state changes
const queueState = useQuery(api.queues.getCreatorQueueState, { creatorId });

// This will automatically update when:
// - A ticket is approved (added to main queue)
// - A ticket is rejected (queue metrics updated)
// - Queue positions change
```

### 2. Ticket List Updates

```typescript
// Subscribe to pending tickets
const pendingTickets = useQuery(api.tickets.getTicketsByCreator, {
  creatorId,
  status: "pending",
});

// This will automatically update when:
// - New tickets are submitted
// - Tickets are approved/rejected
// - Ticket status changes
```

## Error Handling Strategies

### 1. Network Errors

- Display retry option
- Preserve form state
- Show connection status

### 2. Permission Errors

- Redirect to login
- Clear sensitive data
- Show helpful message

### 3. Validation Errors

- Display specific error messages
- Highlight invalid fields
- Prevent invalid submissions

### 4. Concurrency Issues

- Implement retry logic
- Handle version conflicts
- Show appropriate messaging

## Performance Optimizations

### 1. Optimistic Updates

- Update UI immediately
- Rollback on failure
- Improve perceived performance

### 2. Batch Operations

- Group multiple actions
- Reduce network requests
- Show progress indicators

### 3. Efficient Re-rendering

- Memoize components
- Optimize dependencies
- Minimize unnecessary updates

## Accessibility

### 1. Keyboard Navigation

- Tab order logical
- Focus management
- Keyboard shortcuts

### 2. Screen Reader Support

- ARIA labels
- Status announcements
- Contextual information

### 3. Visual Accessibility

- High contrast colors
- Clear focus indicators
- Large touch targets

## Testing Strategy

### 1. Unit Tests

- Component behavior
- Hook functionality
- Error scenarios

### 2. Integration Tests

- Complete workflow
- Real-time updates
- Error handling

### 3. E2E Tests

- User interactions
- Network conditions
- Accessibility compliance
