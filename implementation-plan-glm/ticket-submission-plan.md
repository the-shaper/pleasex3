# Ticket Submission Flow Implementation Plan

## Overview

The ticket submission flow allows users to submit favor requests through a form, selecting between personal and priority queues, setting tip amounts, and providing necessary details. The flow consists of a server component wrapper and a client-side form component.

## File Structure

```
src/app/[slug]/submit/
├── page.tsx              # Server component wrapper
└── loading.tsx           # Loading state

src/components/
└── SubmitClient.tsx      # Client form component

src/app/status/
└── [ref]/
    └── page.tsx          # Ticket status page
```

## Component Architecture

### 1. Submit Page Wrapper (src/app/[slug]/submit/page.tsx)

**Purpose:** Server component that fetches initial data and handles authentication checks.

**Data Requirements:**

- Creator information
- Queue state for both queues
- URL parameters for pre-filled values

**Implementation:**

```typescript
// src/app/[slug]/submit/page.tsx
import { notFound } from "next/navigation";
import { getCreatorBySlug, getCreatorQueueState } from "@/convex/queries";
import { SubmitClient } from "@/components/SubmitClient";

interface SubmitPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ queue?: string; tipCents?: string }>;
}

export default async function SubmitPage({
  params,
  searchParams,
}: SubmitPageProps) {
  const { slug } = await params;
  const { queue, tipCents } = await searchParams;

  // Fetch creator data
  const creator = await getCreatorBySlug({ slug });
  if (!creator) {
    notFound();
  }

  // Fetch queue state
  const queueState = await getCreatorQueueState({ creatorId: creator._id });

  return (
    <div className="min-h-screen bg-bg">
      <SubmitClient
        creatorId={creator._id}
        creatorSlug={creator.slug}
        creatorName={creator.displayName}
        minPriorityTipCents={creator.minPriorityTipCents}
        initialQueue={queueState}
        initialQueueType={queue as "personal" | "priority" | undefined}
        initialTipCents={tipCents ? parseInt(tipCents, 10) : undefined}
      />
    </div>
  );
}
```

### 2. Submit Client Component (src/components/SubmitClient.tsx)

**Purpose:** Client component that handles form submission, queue selection, and tip amount management.

**Key Features:**

- Dynamic queue type switching based on tip amount
- Real-time queue metrics display
- Form validation and submission
- Loading states and error handling

**Migration Steps:**

1. **Update Props Interface:**

```typescript
interface SubmitClientProps {
  creatorId: Id<"creators">;
  creatorSlug: string;
  creatorName: string;
  minPriorityTipCents: number;
  initialQueue: QueueState;
  initialQueueType?: "personal" | "priority";
  initialTipCents?: number;
}
```

2. **Add Convex Hooks:**

```typescript
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/api";

export default function SubmitClient({
  creatorId,
  creatorSlug,
  creatorName,
  minPriorityTipCents,
  initialQueue,
  initialQueueType,
  initialTipCents,
}: SubmitClientProps) {
  // Get real-time queue state
  const queueState = useQuery(api.queues.getCreatorQueueState, { creatorId });

  // Submit ticket mutation
  const submitTicket = useMutation(api.tickets.submitTicket);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state initialization
  const [queue, setQueue] = useState<"personal" | "priority">(
    initialQueueType || "personal"
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    social: "",
    needText: "",
    attachments: "",
    priorityTipCents: initialTipCents || 0,
    consentEmail: false,
  });
}
```

3. **Implement Auto-switch Logic:**

```typescript
// Auto-switch queue based on tip threshold
useEffect(() => {
  if (minPriorityTipCents <= 0) return;
  if (form.priorityTipCents >= minPriorityTipCents && queue !== "priority") {
    setQueue("priority");
  } else if (
    form.priorityTipCents < minPriorityTipCents &&
    queue !== "personal"
  ) {
    setQueue("personal");
  }
}, [form.priorityTipCents, minPriorityTipCents, queue]);
```

4. **Update Form Submission:**

```typescript
async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // Validate form
    if (!form.name.trim() || !form.email.trim() || !form.needText.trim()) {
      throw new Error("Please fill in all required fields");
    }

    // Validate email
    if (!form.email.includes("@")) {
      throw new Error("Please enter a valid email address");
    }

    // Validate priority queue requirements
    if (queue === "priority" && form.priorityTipCents < minPriorityTipCents) {
      throw new Error(
        `Minimum tip for priority is $${(minPriorityTipCents / 100).toFixed(2)}`
      );
    }

    // Parse attachments
    const attachments = form.attachments
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Submit ticket
    const result = await submitTicket({
      creatorId,
      queue,
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      location: form.location || undefined,
      social: form.social || undefined,
      needText: form.needText,
      attachments,
      priorityTipCents: form.priorityTipCents,
      consentEmail: form.consentEmail,
    });

    // Navigate to status page
    router.push(`/status/${result.referenceNumber}`);
  } catch (error) {
    alert(error instanceof Error ? error.message : "An error occurred");
  } finally {
    setIsSubmitting(false);
  }
}
```

5. **Add Real-time Queue Metrics:**

```typescript
const activeQueue =
  queue === "priority"
    ? queueState?.priorityQueue || initialQueue.priorityQueue
    : queueState?.personalQueue || initialQueue.personalQueue;
```

### 3. Loading State (src/app/[slug]/submit/loading.tsx)

**Purpose:** Loading state while fetching creator and queue data.

**Implementation:**

```typescript
// src/app/[slug]/submit/loading.tsx
export default function SubmitPageLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-24 bg-slate-200 rounded" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-slate-200 rounded" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-12 bg-slate-200 rounded" />
            <div className="h-64 bg-slate-200 rounded" />
            <div className="h-16 bg-slate-200 rounded" />
            <div className="h-12 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4. Status Page (src/app/status/[ref]/page.tsx)

**Purpose:** Page to check ticket status after submission.

**Implementation:**

```typescript
// src/app/status/[ref]/page.tsx
import { notFound } from "next/navigation";
import { getTicketByReference } from "@/convex/queries";
import { TicketStatusCard } from "@/components/TicketStatusCard";

interface StatusPageProps {
  params: Promise<{ ref: string }>;
}

export default async function StatusPage({ params }: StatusPageProps) {
  const { ref } = await params;

  try {
    const ticket = await getTicketByReference({ referenceNumber: ref });

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <TicketStatusCard ticket={ticket} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
```

## Data Flow

1. **Page Load:**

   - Server component fetches creator and queue data
   - Client component initializes with URL parameters
   - Real-time subscription to queue updates

2. **Form Interaction:**

   - User fills in form fields
   - Queue type auto-switches based on tip amount
   - Real-time queue metrics update

3. **Form Submission:**

   - Client-side validation
   - Convex mutation to create ticket
   - Navigation to status page

4. **Status Check:**
   - Server fetches ticket by reference
   - Displays current status and position

## Form Validation

### Client-side Validation

- Required fields: name, email, need text
- Email format validation
- Minimum tip validation for priority queue
- Attachment URL format validation

### Server-side Validation

- All client-side validations repeated
- Creator existence check
- Queue availability check
- Rate limiting (future implementation)

## Error Handling

1. **Validation Errors:**

   - Display inline error messages
   - Highlight invalid fields
   - Prevent submission until fixed

2. **Network Errors:**

   - Show retry option
   - Preserve form data
   - Display connection status

3. **Server Errors:**
   - User-friendly error messages
   - Fallback to manual submission
   - Error reporting (future)

## Performance Optimizations

1. **Form State Management:**

   - Debounce tip amount changes
   - Optimize re-renders
   - Lazy validation

2. **Real-time Updates:**

   - Subscribe only to necessary data
   - Throttle queue metric updates
   - Optimize query patterns

3. **Navigation:**
   - Prefetch status page
   - Optimize route transitions
   - Cache form data

## Accessibility

1. **Form Accessibility:**

   - Proper label associations
   - ARIA descriptions
   - Keyboard navigation

2. **Error Announcements:**

   - Screen reader support
   - Focus management
   - Clear error indicators

3. **Visual Accessibility:**
   - High contrast colors
   - Clear focus indicators
   - Responsive text sizing

## Security Considerations

1. **Input Sanitization:**

   - XSS prevention
   - URL validation
   - Content Security Policy

2. **Rate Limiting:**

   - Submission throttling
   - IP-based limits
   - CAPTCHA integration (future)

3. **Data Privacy:**
   - Consent management
   - Data retention policies
   - GDPR compliance (future)
