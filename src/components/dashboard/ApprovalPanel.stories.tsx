import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ApprovalPanel from "./approvalPanel";
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

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Components/Dashboard/ApprovalPanel",
  component: ApprovalPanel,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    tickets: {
      control: "object",
      description: "Array of tickets to display in the approval panel",
    },
    onTicketUpdate: {
      action: "onTicketUpdate",
      description: "Callback function when a ticket is updated",
    },
  },
} satisfies Meta<typeof ApprovalPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Empty: Story = {
  args: {
    tickets: [],
  },
};

export const SinglePending: Story = {
  args: {
    tickets: [sampleTicket],
  },
};

export const MultiplePending: Story = {
  args: {
    tickets: [sampleTicket, sampleTicket2],
  },
};
