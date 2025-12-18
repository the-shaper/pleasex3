import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueueSettingsContent } from "./QueueSettings";
import type { QueueSnapshot } from "@/lib/types";

// Sample queue snapshot data
const sampleQueueSnapshot: QueueSnapshot = {
  personal: {
    enabled: true,
    activeCount: 5,
    currentTicketNumber: 10,
    nextTicketNumber: 15,
    etaDays: 3,
    avgDaysPerTicket: 2,
  },
  priority: {
    enabled: true,
    activeCount: 3,
    currentTicketNumber: 5,
    nextTicketNumber: 8,
    etaDays: 1,
    avgDaysPerTicket: 1,
  },
  general: {
    enabled: false,
    activeCount: 0,
    currentTicketNumber: 0,
    nextTicketNumber: 0,
    etaDays: null,
    avgDaysPerTicket: 0,
  },
};

const disabledQueueSnapshot: QueueSnapshot = {
  personal: {
    enabled: false,
    activeCount: 0,
    currentTicketNumber: 0,
    nextTicketNumber: 0,
    etaDays: null,
    avgDaysPerTicket: 1,
  },
  priority: {
    enabled: false,
    activeCount: 0,
    currentTicketNumber: 0,
    nextTicketNumber: 0,
    etaDays: null,
    avgDaysPerTicket: 1,
  },
  general: {
    enabled: false,
    activeCount: 0,
    currentTicketNumber: 0,
    nextTicketNumber: 0,
    etaDays: null,
    avgDaysPerTicket: 0,
  },
};

const meta = {
  title: "Components/Dashboard/QueueSettings",
  component: QueueSettingsContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    queueSnapshot: {
      control: "object",
      description:
        "Snapshot of the current queue state with metrics for personal and priority queues",
    },
    toggleQueue: {
      action: "toggleQueue",
      description: "Function to toggle queue enabled/disabled state",
    },
    slug: {
      control: "text",
      description: "Creator slug identifier",
    },
    personalEnabled: {
      control: "boolean",
      description: "Whether the personal queue is enabled",
    },
    setPersonalEnabled: {
      action: "setPersonalEnabled",
      description: "Function to update personal queue enabled state",
    },
    priorityEnabled: {
      control: "boolean",
      description: "Whether the priority queue is enabled",
    },
    setPriorityEnabled: {
      action: "setPriorityEnabled",
      description: "Function to update priority queue enabled state",
    },
    personalTippingEnabled: {
      control: "boolean",
      description: "Whether tipping is enabled for personal queue",
    },
    setPersonalTippingEnabled: {
      action: "setPersonalTippingEnabled",
      description: "Function to update tipping state",
    },
    showAutoqueueCard: {
      control: "boolean",
      description: "Whether to show the autoqueue card toggle option",
    },
    onToggleAutoqueueCard: {
      action: "onToggleAutoqueueCard",
      description: "Function to toggle autoqueue card visibility",
    },
    minPriorityTipCents: {
      control: "number",
      description: "Minimum priority tip amount in cents",
    },
    // New props for View component
    personalDays: { control: "number" },
    priorityDays: { control: "number" },
    minFee: { control: "number" },
    onDaysChange: { action: "onDaysChange" },
    onMinFeeChange: { action: "onMinFeeChange" },
    onTogglePersonalTipping: { action: "onTogglePersonalTipping" },
  },
} satisfies Meta<typeof QueueSettingsContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock toggle function that returns the new state
const mockToggleQueue = async (args: {
  creatorSlug: string;
  kind: "personal" | "priority";
}) => {
  console.log("Toggle queue:", args);
  return { enabled: true };
};

const defaultArgs = {
  toggleQueue: mockToggleQueue,
  slug: "creator-demo",
  personalEnabled: true,
  setPersonalEnabled: () => { },
  priorityEnabled: true,
  setPriorityEnabled: () => { },
  personalTippingEnabled: true,
  setPersonalTippingEnabled: () => { },
  minPriorityTipCents: 5000,
  hasStripeAccount: true,
  personalDays: 3,
  priorityDays: 1,
  minFee: 50,
  onDaysChange: () => { },
  onMinFeeChange: () => { },
  onTogglePersonalTipping: async () => { },
};



export const BothQueuesEnabled: Story = {
  args: {
    ...defaultArgs,
    queueSnapshot: sampleQueueSnapshot,
  },
};

export const BothQueuesDisabled: Story = {
  args: {
    ...defaultArgs,
    queueSnapshot: disabledQueueSnapshot,
    personalEnabled: false,
    priorityEnabled: false,
    personalTippingEnabled: false,
    hasStripeAccount: false,
  },
};

export const PersonalOnlyEnabled: Story = {
  args: {
    ...defaultArgs,
    queueSnapshot: {
      ...sampleQueueSnapshot,
      priority: {
        ...sampleQueueSnapshot.priority,
        enabled: false,
      },
    },
    personalEnabled: true,
    priorityEnabled: false,
  },
};

export const PriorityOnlyEnabled: Story = {
  args: {
    ...defaultArgs,
    queueSnapshot: {
      ...sampleQueueSnapshot,
      personal: {
        ...sampleQueueSnapshot.personal,
        enabled: false,
      },
    },
    personalEnabled: false,
    priorityEnabled: true,
  },
};

export const WithAutoqueueCardToggle: Story = {
  args: {
    ...defaultArgs,
    queueSnapshot: sampleQueueSnapshot,
    showAutoqueueCard: true,
    onToggleAutoqueueCard: () => { },
  },
};

export const HighMinimumFee: Story = {
  args: {
    ...defaultArgs,
    queueSnapshot: sampleQueueSnapshot,
    minPriorityTipCents: 25000, // $250
    minFee: 250,
  },
};

export const LowMinimumFee: Story = {
  args: {
    ...defaultArgs,
    queueSnapshot: sampleQueueSnapshot,
    minPriorityTipCents: 100, // $1
    minFee: 1,
  },
};

export const DefaultMinimumFee: Story = {
  args: {
    ...defaultArgs,
    queueSnapshot: sampleQueueSnapshot,
    minPriorityTipCents: 0, // Will default to $50
    minFee: 50,
  },
};

export const Loading: Story = {
  args: {
    ...defaultArgs,
    queueSnapshot: null,
    personalEnabled: false,
    priorityEnabled: false,
    personalTippingEnabled: false,
  },
};
