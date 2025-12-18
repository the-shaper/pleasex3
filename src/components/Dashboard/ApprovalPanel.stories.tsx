import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ApprovalPanelContent } from "./approvalPanel";
import type { Ticket } from "@/lib/types";

// Sample data for stories
const sampleTicket: Ticket = {
  ref: "TICKET-001",
  name: "John Doe",
  email: "john@example.com",
  message:
    "Need help with dashboard integration and custom styling for the approval panel.",
  attachments: [],
  tipCents: 1500,
  queueKind: "priority",
  status: "open",
  createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
};

const sampleTicket2: Ticket = {
  ref: "TICKET-002",
  name: "Jane Smith",
  email: "jane@example.com",
  message: "Request for reviewing multiple pending tickets in the queue.",
  attachments: ["https://example.com/attachment1.pdf"],
  tipCents: 2000,
  queueKind: "personal",
  status: "open",
  createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
};

// Queue snapshot mock
const mockQueueSnapshot = {
  priority: { activeCount: 5, etaDays: 1, etaMins: 60 },
  personal: { activeCount: 10, etaDays: 2, etaMins: 120 },
};

// Mock async actions
const mockProcessApprove = async (ticket: Ticket) => {
  console.log("Mock processing approve for", ticket.ref);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Approved");
};

const mockProcessReject = async (ticket: Ticket) => {
  console.log("Mock processing reject for", ticket.ref);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Rejected");
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Components/Dashboard/ApprovalPanel",
  component: ApprovalPanelContent,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // No decorators needed now!

  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    tickets: {
      control: "object",
      description: "Array of tickets to display in the approval panel",
    },
    onProcessApprove: {
      action: "onProcessApprove",
      description: "Async handler for approving a ticket",
    },
    onProcessReject: {
      action: "onProcessReject",
      description: "Async handler for rejecting a ticket",
    },
  },
} satisfies Meta<typeof ApprovalPanelContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args


export const SinglePending: Story = {
  args: {
    tickets: [sampleTicket],
    queueSnapshot: mockQueueSnapshot,
    onProcessApprove: mockProcessApprove,
    onProcessReject: mockProcessReject,
  },
};

export const MultiplePending: Story = {
  args: {
    tickets: [sampleTicket, sampleTicket2],
    queueSnapshot: mockQueueSnapshot,
    onProcessApprove: mockProcessApprove,
    onProcessReject: mockProcessReject,
  },
};

export const Empty: Story = {
  args: {
    tickets: [],
    queueSnapshot: mockQueueSnapshot,
    onProcessApprove: mockProcessApprove,
    onProcessReject: mockProcessReject,
  },
};
