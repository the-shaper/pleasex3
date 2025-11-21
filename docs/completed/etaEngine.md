# ETA Engine Plan

## Objective
Allow creators to define an "Average Time per Ticket" for each queue (Personal/Priority). The system will calculate the total Estimated Wait Time (ETA) based on the number of active tickets in the queue and display it to users.

## Schema Changes
### `convex/schema.ts`
- Update `queues` table to include `avgTimePerTicket` (number, minutes).
- Default value: e.g., 15 minutes.

```typescript
queues: defineTable({
  // ... existing fields
  avgTimePerTicket: v.optional(v.number()), // New field
  // ...
})
```

## Backend Logic
### `convex/queues.ts`
- **Mutation**: `updateQueueSettings` (or update existing `toggleEnabled`)
    - Arguments: `creatorSlug`, `kind`, `avgTimePerTicket`.
    - Action: Updates the `avgTimePerTicket` field in the `queues` table.
- **Query**: `getSnapshot`
    - Logic: Ensure `etaMins` is calculated dynamically or updated whenever `activeCount` or `avgTimePerTicket` changes.
    - Calculation: `etaMins = activeCount * (avgTimePerTicket || 15)`.

## UI Implementation
### Dashboard: `src/components/dashboard/QueueSettings.tsx`
- Add input fields for "Average Time per Favor (mins)" next to the toggle buttons for both Personal and Priority queues.
- Call `updateQueueSettings` on change (debounce or save button).
### Email: 
- Add fields for the ETA in user-facing emails. (Components found in `convex/email`)

### Public Page: `src/app/[slug]/page.tsx` & `QueueCard.tsx`
- The `QueueCard` already receives `data.etaMins`.
- Ensure `getSnapshot` returns the correctly calculated `etaMins` based on the new setting.
- `QueueCard` will display:
    - **Average Time / Favor**: The `avgTimePerTicket` setting.
    - **Estimated Delivery**: Calculated date based on `etaMins`.

## Workflows
1.  **Creator** goes to Dashboard -> Queue Settings.
2.  **Creator** sets "Average Time" for Priority Queue to 30 mins.
3.  **System** updates `queues` table.
4.  **User** visits public page.
5.  **System** calculates `etaMins` (e.g., 5 tickets * 30 mins = 150 mins).
6.  **QueueCard** displays "Estimated Delivery" ~2.5 hours from now.
