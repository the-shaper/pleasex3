# Notification System Implementation Plan

## Overview

The notification system will keep users informed about important updates to their tickets, including approval status changes, queue position updates, and completion notifications. This is planned as a future enhancement to the core system.

## Notification Types

### 1. User Notifications

- **Ticket Submitted**: Confirmation of successful submission
- **Ticket Approved**: Notification when ticket is approved and added to queue
- **Ticket Rejected**: Notification when ticket is rejected with reason
- **Position Update**: Periodic updates on queue position
- **Ticket Completed**: Notification when favor is completed

### 2. Creator Notifications

- **New Submission**: Alert for new ticket submissions
- **Queue Summary**: Daily/weekly summary of queue activity
- **Urgent Requests**: Special notifications for high-priority requests

## Technical Architecture

### 1. Data Model

```typescript
// notifications table
interface Notification {
  _id: Id<"notifications">;
  userId: string; // Could be email or user ID
  ticketId?: Id<"tickets">;
  creatorId?: Id<"creators">;
  type: NotificationType;
  title: string;
  message: string;
  data: any; // Additional data for the notification
  isRead: boolean;
  createdAt: number;
  readAt?: number;
  sentVia: NotificationChannel[];
}

// notification preferences table
interface NotificationPreferences {
  _id: Id<"notificationPreferences">;
  userId: string;
  emailNotifications: boolean;
  positionUpdates: boolean;
  marketingEmails: boolean;
  frequency: "immediate" | "daily" | "weekly";
  createdAt: number;
  updatedAt: number;
}

// notification delivery table
interface NotificationDelivery {
  _id: Id<"notificationDelivery">;
  notificationId: Id<"notifications">;
  channel: NotificationChannel;
  status: "pending" | "sent" | "failed" | "bounced";
  sentAt?: number;
  error?: string;
  retryCount: number;
}
```

### 2. Notification Types Enum

```typescript
enum NotificationType {
  TICKET_SUBMITTED = "ticket_submitted",
  TICKET_APPROVED = "ticket_approved",
  TICKET_REJECTED = "ticket_rejected",
  POSITION_UPDATE = "position_update",
  TICKET_COMPLETED = "ticket_completed",
  NEW_SUBMISSION = "new_submission",
  QUEUE_SUMMARY = "queue_summary",
}

enum NotificationChannel {
  EMAIL = "email",
  IN_APP = "in_app",
  PUSH = "push", // Future
  SMS = "sms", // Future
}
```

## Implementation Strategy

### Phase 1: Basic Email Notifications

#### 1. Email Service Integration

```typescript
// convex/notifications.ts
import { mutation } from "./_generated/server";

export const sendEmailNotification = mutation({
  args: {
    to: v.string(),
    subject: v.string(),
    template: v.string(),
    data: v.any(),
  },
  handler: async (ctx, { to, subject, template, data }) => {
    // Integration with email service (Resend, SendGrid, etc.)
    const emailService = new EmailService({
      apiKey: process.env.EMAIL_API_KEY,
    });

    try {
      const result = await emailService.send({
        to,
        subject,
        template,
        data,
      });

      return { success: true, messageId: result.id };
    } catch (error) {
      console.error("Email send failed:", error);
      throw new Error("Failed to send email");
    }
  },
});
```

#### 2. Notification Triggers

```typescript
// convex/tickets.ts (existing function)
export const approveTicket = mutation({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    // ... existing approval logic ...

    // Trigger notification
    await ctx.scheduler.runAfter(0, api.notifications.sendTicketApprovedEmail, {
      ticketId,
      creatorId: ticket.creatorId,
    });

    return true;
  },
});
```

#### 3. Email Templates

```typescript
// convex/emails.ts
export const emailTemplates = {
  ticketSubmitted: {
    subject: "Your favor request has been submitted",
    template: "ticket-submitted",
  },
  ticketApproved: {
    subject: "Your favor request has been approved!",
    template: "ticket-approved",
  },
  ticketRejected: {
    subject: "Your favor request status",
    template: "ticket-rejected",
  },
  ticketCompleted: {
    subject: "Your favor has been completed!",
    template: "ticket-completed",
  },
};
```

### Phase 2: In-App Notifications

#### 1. In-App Notification System

```typescript
// convex/notifications.ts
export const createNotification = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    ticketId: v.optional(v.id("tickets")),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
      sentVia: ["in_app"],
    });

    // Schedule email if user has email notifications enabled
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (preferences?.emailNotifications) {
      await ctx.scheduler.runAfter(0, api.notifications.sendEmailNotification, {
        userId: args.userId,
        notificationId,
      });
    }

    return notificationId;
  },
});
```

#### 2. Client-side Notification Hook

```typescript
// src/hooks/useNotifications.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/api";

export function useNotifications(userId: string) {
  const notifications = useQuery(api.notifications.getUserNotifications, {
    userId,
  });

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    unreadCount: notifications?.filter((n) => !n.isRead).length || 0,
  };
}
```

#### 3. Notification UI Component

```typescript
// src/components/NotificationDropdown.tsx
"use client";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationDropdown({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markAsRead, markAllAsRead, unreadCount } =
    useNotifications(userId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead({ userId })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications?.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onRead={() =>
                    markAsRead({ notificationId: notification._id })
                  }
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Phase 3: Advanced Features

#### 1. Position Update Notifications

```typescript
// convex/notifications.ts
export const schedulePositionUpdates = mutation({
  args: {
    ticketId: v.id("tickets"),
    frequency: v.number(), // in hours
  },
  handler: async (ctx, { ticketId, frequency }) => {
    // Schedule recurring position updates
    await ctx.scheduler.runAfter(
      frequency * 60 * 60 * 1000,
      api.notifications.sendPositionUpdate,
      { ticketId }
    );
  },
});
```

#### 2. Queue Summary Emails

```typescript
// convex/notifications.ts
export const generateQueueSummary = mutation({
  args: {
    creatorId: v.id("creators"),
    period: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, { creatorId, period }) => {
    // Gather queue statistics
    const stats = await gatherQueueStats(ctx, creatorId, period);

    // Send summary email
    await ctx.scheduler.runAfter(0, api.notifications.sendQueueSummaryEmail, {
      creatorId,
      stats,
    });
  },
});
```

## Email Service Integration

### 1. Resend Integration (Recommended)

```typescript
// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  async send(options: {
    to: string | string[];
    subject: string;
    template?: string;
    html?: string;
    text?: string;
    data?: any;
  }) {
    try {
      const result = await resend.emails.send({
        from: process.env.FROM_EMAIL || "noreply@yourapp.com",
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html:
          options.html || this.renderTemplate(options.template, options.data),
        text: options.text,
      });

      return result;
    } catch (error) {
      console.error("Email service error:", error);
      throw error;
    }
  }

  private renderTemplate(template: string | undefined, data: any): string {
    // Template rendering logic
    // Could use React Email, Handlebars, or simple string replacement
    return "";
  }
}
```

### 2. Email Templates

```typescript
// templates/emails/ticket-approved.tsx
import React from "react";

export function TicketApprovedEmail({ ticket, creator }: any) {
  return (
    <div>
      <h1>Your favor request has been approved!</h1>
      <p>Hi {ticket.name},</p>
      <p>
        {creator.displayName} has approved your favor request and added it to
        their queue.
      </p>

      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "20px",
          margin: "20px 0",
        }}
      >
        <h2>Ticket Details</h2>
        <p>
          <strong>Reference:</strong> {ticket.referenceNumber}
        </p>
        <p>
          <strong>Queue:</strong> {ticket.queueType}
        </p>
        <p>
          <strong>Position:</strong> TBA
        </p>
        <p>
          <strong>Request:</strong> {ticket.needText}
        </p>
      </div>

      <p>
        You can check your ticket status anytime at:
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/status/${ticket.referenceNumber}`}
        >
          {process.env.NEXT_PUBLIC_APP_URL}/status/{ticket.referenceNumber}
        </a>
      </p>

      <p>
        Best regards,
        <br />
        The {creator.displayName} Team
      </p>
    </div>
  );
}
```

## User Preferences

### 1. Preference Management

```typescript
// convex/notificationPreferences.ts
export const updateNotificationPreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      emailNotifications: v.boolean(),
      positionUpdates: v.boolean(),
      marketingEmails: v.boolean(),
      frequency: v.union(
        v.literal("immediate"),
        v.literal("daily"),
        v.literal("weekly")
      ),
    }),
  },
  handler: async (ctx, { userId, preferences }) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...preferences,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("notificationPreferences", {
        userId,
        ...preferences,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});
```

### 2. Preference UI

```typescript
// src/components/NotificationPreferences.tsx
export function NotificationPreferences({ userId }: { userId: string }) {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    positionUpdates: true,
    marketingEmails: false,
    frequency: "immediate" as const,
  });

  const updatePreferences = useMutation(
    api.notificationPreferences.updateNotificationPreferences
  );

  const handleSave = async () => {
    await updatePreferences({ userId, preferences });
    // Show success message
  };

  return (
    <div className="space-y-4">
      <h2>Notification Preferences</h2>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={preferences.emailNotifications}
          onChange={(e) =>
            setPreferences((prev) => ({
              ...prev,
              emailNotifications: e.target.checked,
            }))
          }
        />
        Email notifications
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={preferences.positionUpdates}
          onChange={(e) =>
            setPreferences((prev) => ({
              ...prev,
              positionUpdates: e.target.checked,
            }))
          }
        />
        Queue position updates
      </label>

      <div>
        <label>Email frequency</label>
        <select
          value={preferences.frequency}
          onChange={(e) =>
            setPreferences((prev) => ({
              ...prev,
              frequency: e.target.value as any,
            }))
          }
        >
          <option value="immediate">Immediate</option>
          <option value="daily">Daily digest</option>
          <option value="weekly">Weekly digest</option>
        </select>
      </div>

      <button onClick={handleSave} className="btn btn-primary">
        Save Preferences
      </button>
    </div>
  );
}
```

## Implementation Timeline

### Phase 1: Core Email Notifications (Week 1-2)

- Set up email service integration
- Implement basic notification triggers
- Create email templates
- Add notification preferences

### Phase 2: In-App Notifications (Week 3-4)

- Build notification data model
- Create in-app notification UI
- Implement real-time updates
- Add notification center

### Phase 3: Advanced Features (Week 5-6)

- Position update notifications
- Queue summaries
- Analytics and tracking
- A/B testing for templates

## Performance Considerations

### 1. Batch Processing

- Group email sends to avoid rate limits
- Use queues for high-volume notifications
- Implement retry logic

### 2. Database Optimization

- Index notifications by user and read status
- Archive old notifications
- Clean up delivery records

### 3. Real-time Updates

- Use Convex subscriptions efficiently
- Minimize unnecessary updates
- Implement caching for frequently accessed data
