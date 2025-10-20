# Testing Strategy Implementation Plan

## Overview

This document outlines a comprehensive testing strategy for the ticketing system implementation. The strategy covers unit tests, integration tests, end-to-end tests, and performance testing to ensure system reliability and quality.

## Testing Pyramid

```
    E2E Tests (10%)
   ─────────────────
  Integration Tests (20%)
 ─────────────────────────
Unit Tests (70%)
```

## 1. Unit Testing Strategy

### 1.1 Convex Function Tests

#### Test Structure

```typescript
// convex/__tests__/tickets.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { testConvex } from "convex-test";
import { api } from "../_generated/api";

describe("Ticket Functions", () => {
  let t: ReturnType<typeof testConvex>;

  beforeEach(() => {
    t = testConvex.create();
  });

  describe("submitTicket", () => {
    it("should submit a valid ticket", async () => {
      const creatorId = await t.run(async (ctx) => {
        return await ctx.db.insert("creators", {
          displayName: "Test Creator",
          slug: "test-creator",
          minPriorityTipCents: 5000,
          queueSettings: {
            personalEnabled: true,
            priorityEnabled: true,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      const result = await t.mutation(api.tickets.submitTicket, {
        creatorId,
        queueType: "personal",
        name: "John Doe",
        email: "john@example.com",
        needText: "Test favor request",
        attachments: [],
        priorityTipCents: 0,
        consentEmail: true,
      });

      expect(result).toHaveProperty("ticketId");
      expect(result).toHaveProperty("referenceNumber");

      // Verify ticket was created
      const ticket = await t.query(api.tickets.getTicketByReference, {
        referenceNumber: result.referenceNumber,
      });

      expect(ticket).toMatchObject({
        name: "John Doe",
        email: "john@example.com",
        queueType: "personal",
        status: "pending",
      });
    });

    it("should reject invalid email", async () => {
      const creatorId = await createTestCreator(t);

      await expect(
        t.mutation(api.tickets.submitTicket, {
          creatorId,
          queueType: "personal",
          name: "John Doe",
          email: "invalid-email",
          needText: "Test favor request",
          attachments: [],
          priorityTipCents: 0,
          consentEmail: true,
        })
      ).rejects.toThrow("Invalid email address");
    });

    it("should enforce minimum tip for priority queue", async () => {
      const creatorId = await createTestCreator(t, {
        minPriorityTipCents: 5000,
      });

      await expect(
        t.mutation(api.tickets.submitTicket, {
          creatorId,
          queueType: "priority",
          name: "John Doe",
          email: "john@example.com",
          needText: "Test favor request",
          attachments: [],
          priorityTipCents: 1000, // Below minimum
          consentEmail: true,
        })
      ).rejects.toThrow("Minimum tip for priority is $50.00");
    });
  });

  describe("approveTicket", () => {
    it("should approve a pending ticket", async () => {
      const { creatorId, ticketId } = await createTestTicket(t);

      const result = await t.mutation(api.tickets.approveTicket, { ticketId });

      expect(result).toBe(true);

      // Verify ticket status changed
      const ticket = await t.run(async (ctx) => await ctx.db.get(ticketId));
      expect(ticket?.status).toBe("approved");
      expect(ticket?.approvedAt).toBeDefined();

      // Verify ticket was added to main queue
      const queueState = await t.query(api.queues.getCreatorQueueState, {
        creatorId,
      });
      expect(queueState.mainQueue).toContain(ticketId);
    });

    it("should reject approving non-pending ticket", async () => {
      const { ticketId } = await createTestTicket(t, { status: "approved" });

      await expect(
        t.mutation(api.tickets.approveTicket, { ticketId })
      ).rejects.toThrow("Ticket is not pending");
    });
  });
});

// Helper functions
async function createTestCreator(t: any, overrides = {}) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("creators", {
      displayName: "Test Creator",
      slug: "test-creator",
      minPriorityTipCents: 5000,
      queueSettings: {
        personalEnabled: true,
        priorityEnabled: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    });
  });
}

async function createTestTicket(t: any, overrides = {}) {
  const creatorId = await createTestCreator(t);

  const ticketId = await t.run(async (ctx) => {
    return await ctx.db.insert("tickets", {
      creatorId,
      queueType: "personal",
      status: "pending",
      name: "Test User",
      email: "test@example.com",
      needText: "Test request",
      attachments: [],
      priorityTipCents: 0,
      consentEmail: true,
      submittedAt: Date.now(),
      referenceNumber: "L-test-123",
      ...overrides,
    });
  });

  return { creatorId, ticketId };
}
```

#### Queue Algorithm Tests

```typescript
// convex/__tests__/queueAlgorithm.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { testConvex } from "convex-test";
import { api } from "../_generated/api";

describe("Queue Algorithm", () => {
  let t: ReturnType<typeof testConvex>;

  beforeEach(() => {
    t = testConvex.create();
  });

  describe("buildMainQueue", () => {
    it("should maintain 3:1 priority:personal ratio", async () => {
      const creatorId = await createTestCreator(t);

      // Create tickets: 5 priority, 2 personal
      const priorityTickets = await Promise.all([
        createTestTicket(t, creatorId, {
          queueType: "priority",
          submittedAt: 1000,
        }),
        createTestTicket(t, creatorId, {
          queueType: "priority",
          submittedAt: 2000,
        }),
        createTestTicket(t, creatorId, {
          queueType: "priority",
          submittedAt: 3000,
        }),
        createTestTicket(t, creatorId, {
          queueType: "priority",
          submittedAt: 4000,
        }),
        createTestTicket(t, creatorId, {
          queueType: "priority",
          submittedAt: 5000,
        }),
      ]);

      const personalTickets = await Promise.all([
        createTestTicket(t, creatorId, {
          queueType: "personal",
          submittedAt: 1500,
        }),
        createTestTicket(t, creatorId, {
          queueType: "personal",
          submittedAt: 2500,
        }),
      ]);

      // Approve all tickets
      for (const ticket of [...priorityTickets, ...personalTickets]) {
        await t.mutation(api.tickets.approveTicket, {
          ticketId: ticket.ticketId,
        });
      }

      // Check main queue order
      const mainQueue = await t.query(api.queues.getMainQueue, { creatorId });

      // Expected order: P1, P2, P3, L1, P4, P5, L2
      expect(mainQueue).toHaveLength(7);
      expect(mainQueue[0]).toBe(priorityTickets[0].ticketId);
      expect(mainQueue[1]).toBe(priorityTickets[1].ticketId);
      expect(mainQueue[2]).toBe(priorityTickets[2].ticketId);
      expect(mainQueue[3]).toBe(personalTickets[0].ticketId);
      expect(mainQueue[4]).toBe(priorityTickets[3].ticketId);
      expect(mainQueue[5]).toBe(priorityTickets[4].ticketId);
      expect(mainQueue[6]).toBe(personalTickets[1].ticketId);
    });
  });

  describe("insertTicketIntoMainQueue", () => {
    it("should insert new ticket at correct position", async () => {
      const creatorId = await createTestCreator(t);

      // Create existing queue with ratio maintained
      const existingTickets = await createTestQueue(t, creatorId, {
        priority: 6,
        personal: 2,
      });

      // Insert new priority ticket
      const newTicket = await createTestTicket(t, creatorId, {
        queueType: "priority",
        status: "approved",
      });

      await t.mutation(api.queues.insertTicketIntoMainQueue, {
        creatorId,
        ticketId: newTicket.ticketId,
      });

      // Verify insertion point
      const mainQueue = await t.query(api.queues.getMainQueue, { creatorId });
      const position = mainQueue.indexOf(newTicket.ticketId);

      // Should be inserted after existing priority tickets in its cycle
      expect(position).toBeGreaterThan(-1);
      expect(position).toBeLessThan(mainQueue.length);
    });
  });
});
```

### 1.2 React Component Tests

#### QueueCard Component Tests

```typescript
// src/components/__tests__/QueueCard.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueueCard } from "../QueueCard";
import { ConvexProvider } from "convex/react";
import { testConvex } from "convex-test";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

describe("QueueCard", () => {
  const mockCreatorId = "creator123";
  const mockQueueData = {
    activeTurn: 5,
    nextTurn: 10,
    etaMins: 120,
    enabled: true,
  };

  it("should display queue information correctly", () => {
    render(
      <ConvexProvider client={mockConvexClient}>
        <QueueCard
          kind="personal"
          creatorId={mockCreatorId}
          data={mockQueueData}
          minPriorityTipCents={5000}
        />
      </ConvexProvider>
    );

    expect(screen.getByText("PERSONAL")).toBeInTheDocument();
    expect(screen.getByText("Current Turn")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2h")).toBeInTheDocument();
  });

  it("should update tip amount when buttons are clicked", async () => {
    render(
      <ConvexProvider client={mockConvexClient}>
        <QueueCard
          kind="priority"
          creatorId={mockCreatorId}
          data={mockQueueData}
          minPriorityTipCents={5000}
        />
      </ConvexProvider>
    );

    const decreaseButton = screen.getByLabelText("Decrease tip by one dollar");
    const increaseButton = screen.getByLabelText("Increase tip by one dollar");
    const tipInput = screen.getByLabelText("Tip amount in dollars");

    // Initial tip should be minimum for priority
    expect(tipInput).toHaveValue("50");

    // Increase tip
    fireEvent.click(increaseButton);
    await waitFor(() => {
      expect(tipInput).toHaveValue("51");
    });

    // Decrease tip
    fireEvent.click(decreaseButton);
    await waitFor(() => {
      expect(tipInput).toHaveValue("50");
    });
  });

  it("should disable claim button when below minimum tip", () => {
    render(
      <ConvexProvider client={mockConvexClient}>
        <QueueCard
          kind="priority"
          creatorId={mockCreatorId}
          data={{ ...mockQueueData, enabled: true }}
          minPriorityTipCents={5000}
        />
      </ConvexProvider>
    );

    // Set tip below minimum
    const tipInput = screen.getByLabelText("Tip amount in dollars");
    fireEvent.change(tipInput, { target: { value: "25" } });

    const claimButton = screen.getByRole("button", {
      name: /claim priority ticket/i,
    });
    expect(claimButton).toBeDisabled();
  });

  it("should show 'Currently closed' when queue is disabled", () => {
    render(
      <ConvexProvider client={mockConvexClient}>
        <QueueCard
          kind="personal"
          creatorId={mockCreatorId}
          data={{ ...mockQueueData, enabled: false }}
          minPriorityTipCents={5000}
        />
      </ConvexProvider>
    );

    expect(screen.getByText("Currently closed")).toBeInTheDocument();
  });
});
```

#### SubmitClient Component Tests

```typescript
// src/components/__tests__/SubmitClient.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubmitClient } from "../SubmitClient";

describe("SubmitClient", () => {
  const mockCreator = {
    _id: "creator123",
    slug: "test-creator",
    displayName: "Test Creator",
    minPriorityTipCents: 5000,
  };

  const mockInitialQueue = {
    personalQueue: {
      activeTurn: 5,
      nextTurn: 10,
      etaMins: 120,
      activeCount: 3,
      enabled: true,
    },
    priorityQueue: {
      activeTurn: 2,
      nextTurn: 5,
      etaMins: 60,
      activeCount: 2,
      enabled: true,
    },
  };

  it("should validate required form fields", async () => {
    const mockSubmit = vi
      .fn()
      .mockResolvedValue({ referenceNumber: "L-test-123" });

    render(
      <SubmitClient
        creatorId={mockCreator._id}
        creatorSlug={mockCreator.slug}
        creatorName={mockCreator.displayName}
        minPriorityTipCents={mockCreator.minPriorityTipCents}
        initialQueue={mockInitialQueue}
        submitTicket={mockSubmit}
      />
    );

    const submitButton = screen.getByRole("button", { name: /claim ticket/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please fill in all required fields")
      ).toBeInTheDocument();
    });

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("should switch to priority queue when tip meets minimum", async () => {
    render(
      <SubmitClient
        creatorId={mockCreator._id}
        creatorSlug={mockCreator.slug}
        creatorName={mockCreator.displayName}
        minPriorityTipCents={mockCreator.minPriorityTipCents}
        initialQueue={mockInitialQueue}
      />
    );

    const personalTab = screen.getByRole("button", { name: "Personal" });
    const priorityTab = screen.getByRole("button", { name: "Priority" });

    // Initially on personal tab
    expect(personalTab).toHaveClass("bg-greenlite");
    expect(priorityTab).not.toHaveClass("bg-gold");

    // Increase tip to meet minimum
    const tipInput = screen.getByLabelText("Tip amount in dollars");
    await userEvent.clear(tipInput);
    await userEvent.type(tipInput, "50");

    // Should auto-switch to priority
    await waitFor(() => {
      expect(priorityTab).toHaveClass("bg-gold");
      expect(personalTab).not.toHaveClass("bg-greenlite");
    });
  });

  it("should submit form with valid data", async () => {
    const mockSubmit = vi
      .fn()
      .mockResolvedValue({ referenceNumber: "L-test-123" });
    const mockPush = vi.fn();

    vi.mock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush }),
      useSearchParams: () => new URLSearchParams(),
    }));

    render(
      <SubmitClient
        creatorId={mockCreator._id}
        creatorSlug={mockCreator.slug}
        creatorName={mockCreator.displayName}
        minPriorityTipCents={mockCreator.minPriorityTipCents}
        initialQueue={mockInitialQueue}
        submitTicket={mockSubmit}
      />
    );

    // Fill form
    await userEvent.type(screen.getByPlaceholderText("Name"), "John Doe");
    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "john@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Describe your need"),
      "Test favor request"
    );

    // Submit form
    const submitButton = screen.getByRole("button", { name: /claim ticket/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        creatorId: mockCreator._id,
        queue: "personal",
        name: "John Doe",
        email: "john@example.com",
        needText: "Test favor request",
        attachments: [],
        priorityTipCents: 0,
        consentEmail: false,
        phone: undefined,
        location: undefined,
        social: undefined,
      });
    });

    expect(mockPush).toHaveBeenCalledWith("/status/L-test-123");
  });
});
```

## 2. Integration Testing Strategy

### 2.1 API Integration Tests

```typescript
// tests/integration/tickets.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestServer, closeTestServer } from "../helpers/test-server";

describe("Ticket API Integration", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await setupTestServer();
  });

  afterAll(async () => {
    await closeTestServer(server);
  });

  it("should create and approve ticket end-to-end", async () => {
    // Create creator
    const creator = await server.request("POST", "/api/creators", {
      displayName: "Test Creator",
      slug: "test-creator",
      minPriorityTipCents: 5000,
    });

    expect(creator.status).toBe(201);

    // Submit ticket
    const ticketResponse = await server.request("POST", "/api/tickets", {
      creatorSlug: "test-creator",
      queue: "personal",
      name: "John Doe",
      email: "john@example.com",
      needText: "Test favor request",
      attachments: [],
      priorityTipCents: 0,
      consentEmail: true,
    });

    expect(ticketResponse.status).toBe(201);
    const { referenceNumber } = await ticketResponse.json();

    // Check ticket status
    const statusResponse = await server.request(
      "GET",
      `/api/tickets/${referenceNumber}`
    );

    expect(statusResponse.status).toBe(200);
    const ticket = await statusResponse.json();
    expect(ticket.status).toBe("pending");

    // Approve ticket (as creator)
    const approveResponse = await server.request(
      "POST",
      `/api/tickets/${ticket.id}/approve`,
      {},
      { authorization: `Bearer ${creator.token}` }
    );

    expect(approveResponse.status).toBe(200);

    // Verify ticket is in main queue
    const queueResponse = await server.request(
      "GET",
      `/api/creators/test-creator/queue`
    );

    const queueData = await queueResponse.json();
    expect(queueData.mainQueue).toContain(ticket.id);
  });
});
```

### 2.2 Real-time Updates Tests

```typescript
// tests/integration/realtime.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestServer, closeTestServer } from "../helpers/test-server";
import { ConvexClient } from "convex/browser";

describe("Real-time Updates", () => {
  let server: TestServer;
  let client1: ConvexClient;
  let client2: ConvexClient;

  beforeAll(async () => {
    server = await setupTestServer();
    client1 = new ConvexClient(server.convexUrl);
    client2 = new ConvexClient(server.convexUrl);
  });

  afterAll(async () => {
    await client1.close();
    await client2.close();
    await closeTestServer(server);
  });

  it("should update queue state in real-time", async () => {
    const creatorId = "test-creator";

    // Subscribe to queue updates on both clients
    let client1Update: any = null;
    let client2Update: any = null;

    client1.onUpdate(
      api.queues.getCreatorQueueState,
      (data) => {
        client1Update = data;
      },
      { creatorId }
    );

    client2.onUpdate(
      api.queues.getCreatorQueueState,
      (data) => {
        client2Update = data;
      },
      { creatorId }
    );

    // Wait for initial data
    await waitFor(() => client1Update !== null);
    await waitFor(() => client2Update !== null);

    const initialCount = client1Update.personalQueue.nextTurn;

    // Submit new ticket via client1
    const ticketId = await client1.mutation(api.tickets.submitTicket, {
      creatorId,
      queueType: "personal",
      name: "Test User",
      email: "test@example.com",
      needText: "Test request",
      attachments: [],
      priorityTipCents: 0,
      consentEmail: true,
    });

    // Both clients should receive updates
    await waitFor(
      () => client1Update.personalQueue.nextTurn === initialCount + 1
    );
    await waitFor(
      () => client2Update.personalQueue.nextTurn === initialCount + 1
    );

    expect(client1Update.personalQueue.nextTurn).toBe(initialCount + 1);
    expect(client2Update.personalQueue.nextTurn).toBe(initialCount + 1);
  });
});
```

## 3. End-to-End Testing Strategy

### 3.1 Playwright E2E Tests

```typescript
// tests/e2e/creator-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Creator Queue Flow", () => {
  test("should display creator page and allow ticket submission", async ({
    page,
  }) => {
    // Visit creator page
    await page.goto("/test-creator");

    // Check page loads correctly
    await expect(page.locator("h1")).toContainText("NEED A QUICK FAVOR FROM");
    await expect(page.locator("h1")).toContainText("TEST CREATOR");

    // Check both queue cards are displayed
    await expect(
      page.locator('[data-testid="personal-queue-card"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="priority-queue-card"]')
    ).toBeVisible();

    // Check queue information
    await expect(
      page.locator('[data-testid="personal-next-turn"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="priority-next-turn"]')
    ).toBeVisible();

    // Click claim ticket on personal queue
    await page.click('[data-testid="personal-claim-button"]');

    // Should navigate to submit page
    await expect(page).toHaveURL(/\/test-creator\/submit/);
    await expect(page.locator("h1")).toContainText("Claim a ticket");
  });

  test("should submit ticket with valid data", async ({ page }) => {
    await page.goto("/test-creator/submit?queue=personal");

    // Fill form
    await page.fill('input[placeholder="Name"]', "John Doe");
    await page.fill('input[placeholder="Email"]', "john@example.com");
    await page.fill(
      'textarea[placeholder="Describe your need"]',
      "Test favor request"
    );

    // Submit form
    await page.click('button[type="submit"]');

    // Should navigate to status page
    await expect(page).toHaveURL(/\/status\//);
    await expect(page.locator("h1")).toContainText("Ticket Status");

    // Check ticket details are displayed
    await expect(page.locator('[data-testid="ticket-status"]')).toContainText(
      "pending"
    );
    await expect(page.locator('[data-testid="ticket-name"]')).toContainText(
      "John Doe"
    );
  });

  test("should handle queue switching based on tip amount", async ({
    page,
  }) => {
    await page.goto("/test-creator/submit");

    // Should start on personal queue
    await expect(page.locator('[data-testid="personal-tab"]')).toHaveClass(
      /bg-greenlite/
    );

    // Increase tip to meet minimum for priority
    await page.fill('input[aria-label="Tip amount in dollars"]', "50");

    // Should auto-switch to priority queue
    await expect(page.locator('[data-testid="priority-tab"]')).toHaveClass(
      /bg-gold/
    );

    // Decrease tip below minimum
    await page.fill('input[aria-label="Tip amount in dollars"]', "25");

    // Should switch back to personal
    await expect(page.locator('[data-testid="personal-tab"]')).toHaveClass(
      /bg-greenlite/
    );
  });
});

test.describe("Creator Dashboard", () => {
  test("should allow creator to approve and reject tickets", async ({
    page,
  }) => {
    // Login as creator
    await page.goto("/login");
    await page.fill('input[name="email"]', "creator@example.com");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');

    // Navigate to dashboard
    await page.goto("/dashboard/test-creator");

    // Check pending tickets are displayed
    await expect(page.locator('[data-testid="pending-tickets"]')).toBeVisible();

    // Approve first ticket
    await page.click('[data-testid="approve-button"]:first-child');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "Approved successfully"
    );

    // Ticket should move to approved tab
    await page.click('[data-testid="approved-tab"]');
    await expect(
      page.locator('[data-testid="approved-tickets"]')
    ).toBeVisible();
  });
});
```

### 3.2 Mobile Responsiveness Tests

```typescript
// tests/e2e/mobile.spec.ts
import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone 13"] });

test("should work correctly on mobile", async ({ page }) => {
  await page.goto("/test-creator");

  // Check mobile layout
  await expect(page.locator('[data-testid="queue-cards"]')).toBeVisible();

  // Cards should be stacked vertically
  const cards = page.locator('[data-testid="queue-card"]');
  await expect(cards).toHaveCount(2);

  const firstCard = cards.first();
  const secondCard = cards.nth(1);

  const firstBox = await firstCard.boundingBox();
  const secondBox = await secondCard.boundingBox();

  // Second card should be below first
  expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height);

  // Test mobile form submission
  await page.click('[data-testid="personal-claim-button"]');
  await page.fill('input[placeholder="Name"]', "Mobile User");
  await page.fill('input[placeholder="Email"]', "mobile@example.com");
  await page.fill(
    'textarea[placeholder="Describe your need"]',
    "Mobile test request"
  );

  // Submit button should be visible and clickable
  await expect(page.locator('button[type="submit"]')).toBeVisible();
  await page.click('button[type="submit"]');

  // Should navigate to status page
  await expect(page).toHaveURL(/\/status\//);
});
```

## 4. Performance Testing Strategy

### 4.1 Load Testing

```typescript
// tests/performance/load-test.ts
import { check, sleep } from "k6";
import http from "k6/http";

export let options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 200 }, // Ramp up to 200 users
    { duration: "5m", target: 200 }, // Stay at 200 users
    { duration: "2m", target: 0 }, // Ramp down
  ],
};

const BASE_URL = "http://localhost:3000";

export default function () {
  // Test creator page load
  let response = http.get(`${BASE_URL}/test-creator`);
  check(response, {
    "creator page status is 200": (r) => r.status === 200,
    "creator page load time < 500ms": (r) => r.timings.waiting < 500,
  });

  // Test ticket submission
  response = http.post(
    `${BASE_URL}/api/tickets`,
    JSON.stringify({
      creatorSlug: "test-creator",
      queue: "personal",
      name: `Load Test User ${__VU}`,
      email: `loadtest${__VU}@example.com`,
      needText: "Load test request",
      attachments: [],
      priorityTipCents: 0,
      consentEmail: true,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  check(response, {
    "ticket submission status is 201": (r) => r.status === 201,
    "ticket submission time < 1000ms": (r) => r.timings.waiting < 1000,
  });

  sleep(1);
}
```

### 4.2 Performance Budget Tests

```typescript
// tests/performance/budget.test.ts
import { test, expect } from "@playwright/test";

test.describe("Performance Budgets", () => {
  test("should meet performance budgets", async ({ page }) => {
    // Start monitoring
    const metrics = [];

    page.on("response", (response) => {
      metrics.push({
        url: response.url(),
        status: response.status(),
        timing: response.request().timing(),
      });
    });

    // Navigate to creator page
    await page.goto("/test-creator");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Check performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType("paint")[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByType("paint")[1]?.startTime || 0,
      };
    });

    // Assert performance budgets
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1500);
    expect(performanceMetrics.loadComplete).toBeLessThan(3000);
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1000);

    // Check API response times
    const apiCalls = metrics.filter((m) => m.url.includes("/api/"));
    for (const call of apiCalls) {
      expect(call.timing.responseEnd - call.timing.requestStart).toBeLessThan(
        1000
      );
    }
  });
});
```

## 5. Testing Configuration

### 5.1 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "**/*.test.ts", "**/*.spec.ts"],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

### 5.2 Test Setup

```typescript
// tests/setup.ts
import { vi } from "vitest";
import { config } from "@testing-library/react";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Configure testing library
config({ testIdAttribute: "data-testid" });

// Global test utilities
global.createMockCreator = (overrides = {}) => ({
  _id: "creator123",
  displayName: "Test Creator",
  slug: "test-creator",
  minPriorityTipCents: 5000,
  queueSettings: {
    personalEnabled: true,
    priorityEnabled: true,
  },
  ...overrides,
});

global.createMockTicket = (overrides = {}) => ({
  _id: "ticket123",
  creatorId: "creator123",
  queueType: "personal",
  status: "pending",
  name: "Test User",
  email: "test@example.com",
  needText: "Test request",
  attachments: [],
  priorityTipCents: 0,
  consentEmail: true,
  submittedAt: Date.now(),
  referenceNumber: "L-test-123",
  ...overrides,
});
```

## 6. Continuous Integration

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Start test server
        run: npm run test:start &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Wait for server
        run: sleep 10

      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm run start &

      - name: Wait for server
        run: sleep 10

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

This comprehensive testing strategy ensures the reliability, performance, and quality of the ticketing system implementation across all levels of the application stack.
