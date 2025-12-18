import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import TicketApprovalCreatorCard from "./ticketApprovalCreatorCard";

// Helper function for formatting ETA (as used in ApprovalPanel)
const formatEtaMins = (mins: number): string => {
  if (!mins || mins <= 0) return "—";
  if (mins < 60) return "<1h";
  const hours = Math.round(mins / 60);
  return `${hours}h`;
};



// Update sample form - add optional taskTitle (short), keep needText (long)
const sampleForm = {
  name: "John Doe",
  email: "john@example.com",
  taskTitle: "Dashboard Integration",  // New: Short title example
  needText: "Need help integrating a new dashboard feature for ticket approvals.",  // Long desc
  attachments: "",
  priorityTipCents: 1500,
};

// Sample queue metrics
const sampleQueueMetrics = {
  personal: { etaMins: 90 },
  priority: { etaMins: 45 },
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Components/Dashboard/ticketApprovalCreatorCard",
  component: TicketApprovalCreatorCard,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
    docs: {
      description: {
        component: "This is the ticket the creator sees when a new submission appears on their dashboard.",
      },
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    form: {
      control: "object",
      description: "Form data; now includes optional taskTitle (short) alongside needText (long)",
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
    approveHandler: {
      action: "approveHandler",
      description: "Handler for approve button click",
    },
    rejectHandler: {
      action: "rejectHandler",
      description: "Handler for reject button click",
    },
    isLoading: {
      control: "boolean",
      description: "Whether buttons are in loading state",
    },
  },
} satisfies Meta<typeof TicketApprovalCreatorCard>;

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
    onChange: () => { },
    userName: "Alejandro",
    referenceNumber: "TICKET-001",
    approvedContext: false,
    // Omit approveHandler and rejectHandler for auto-binding
    isLoading: false,
  },
};

// Update Priority story
export const Priority: Story = {
  args: {
    ...Default.args,
    form: {
      ...sampleForm,
      name: "Jane Smith",
      taskTitle: "Payment Bug Fix",  // Short
      needText: "Urgent: Fix critical bug in payment processing.",  // Long
      attachments: "error-log.txt, screenshot.png", // String example
      priorityTipCents: 2500,
    },
    isPriority: true,
    tipDollarsInt: 25,
    referenceNumber: "TICKET-002",
    // Omit handlers and onChange for auto-binding
    isLoading: false,
  },
};

// Update Approved story
export const Approved: Story = {
  args: {
    ...Default.args,
    form: {
      ...sampleForm,
      name: "Alex Johnson",
      taskTitle: "Dashboard Review",  // Short
      needText: "Approved ticket for dashboard review.",  // Long
      attachments: "design-spec.pdf", // Single attachment as string
    },
    approvedContext: true,
    referenceNumber: "TICKET-003",
    // Omit handlers and onChange for auto-binding
    isLoading: false,
  },
};



// Add new Loading story
export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
    // Handlers and onChange auto-bound if needed
  },
};
