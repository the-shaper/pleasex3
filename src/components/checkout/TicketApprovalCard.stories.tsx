import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import TicketApprovalCard from "./ticketApprovalCard";
import type { FormData } from "@/lib/types"; // FormData has attachments as string (comma-separated or empty)

// Helper function for formatting ETA (as used in ApprovalPanel)
const formatEtaMins = (mins: number): string => {
  if (!mins || mins <= 0) return "—";
  if (mins < 60) return "<1h";
  const hours = Math.round(mins / 60);
  return `${hours}h`;
};

// Update the import comment for clarity
import type { FormData } from "@/lib/types"; // FormData has attachments as string (comma-separated or empty)

// Update sample form data - attachments as string
const sampleForm = {
  name: "John Doe",
  email: "john@example.com",
  needText:
    "Need help integrating a new dashboard feature for ticket approvals.",
  attachments: "", // Empty string for no attachments
  priorityTipCents: 1500,
};

// Sample queue metrics
const sampleQueueMetrics = {
  personal: { etaMins: 90 },
  priority: { etaMins: 45 },
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Components/Checkout/TicketApprovalCard",
  component: TicketApprovalCard,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    form: {
      control: "object",
      description: "Form data containing user input and tip information",
    },
    isPriority: {
      control: "boolean",
      description: "Whether the ticket is a priority queue ticket",
    },
    activeQueue: {
      control: "object",
      description: "Current queue state (nextTurn, activeCount)",
    },
    tipDollarsInt: {
      control: "number",
      description: "Tip amount in whole dollars",
    },
    minPriorityTipCents: {
      control: "number",
      description: "Minimum tip required for priority queue in cents",
    },
    queueMetrics: {
      control: "object",
      description: "ETA metrics for different queue types",
    },
    formatEtaMins: {
      control: false,
      description: "Function to format ETA in minutes to readable string",
    },
    onChange: {
      action: "onChange",
      description: "Callback for form changes",
    },
    userName: {
      control: "text",
      description: "Name of the creator/user viewing the card",
    },
    referenceNumber: {
      control: "text",
      description: "Unique reference number for the ticket",
    },
    approvedContext: {
      control: "boolean",
      description: "Whether to show the card in an approved state",
    },
  },
} satisfies Meta<typeof TicketApprovalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    form: sampleForm,
    isPriority: false,
    activeQueue: { nextTurn: 1, activeCount: 1 },
    tipDollarsInt: 15,
    minPriorityTipCents: 1500,
    queueMetrics: sampleQueueMetrics,
    formatEtaMins,
    onChange: () => {},
    userName: "Alejandro",
    referenceNumber: "TICKET-001",
    approvedContext: false,
  },
};

// Update Priority story
export const Priority: Story = {
  args: {
    ...Default.args,
    form: {
      ...sampleForm,
      name: "Jane Smith",
      needText: "Urgent: Fix critical bug in payment processing.",
      attachments: "error-log.txt, screenshot.png", // String example
      priorityTipCents: 2500,
    },
    isPriority: true,
    tipDollarsInt: 25,
    referenceNumber: "TICKET-002",
  },
};

// Update Approved story
export const Approved: Story = {
  args: {
    ...Default.args,
    form: {
      ...sampleForm,
      name: "Alex Johnson",
      needText: "Approved ticket for dashboard review.",
      attachments: "design-spec.pdf", // Single attachment as string
    },
    approvedContext: true,
    referenceNumber: "TICKET-003",
  },
};

// Add a new story for attachments demo
export const WithAttachments: Story = {
  args: {
    ...Default.args,
    form: {
      ...sampleForm,
      name: "Sample User",
      needText: "Ticket with multiple attachments.",
      attachments: "doc1.pdf, image.jpg, link-to-video.mp4", // Multi-attachment string
    },
    referenceNumber: "TICKET-004",
  },
};
