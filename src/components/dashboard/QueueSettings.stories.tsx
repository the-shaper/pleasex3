import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueueSettings } from "./QueueSettings";
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
  component: QueueSettings,
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
  },
} satisfies Meta<typeof QueueSettings>;

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

export const Loading: Story = {
  args: {
    queueSnapshot: null,
    toggleQueue: mockToggleQueue,
    slug: "creator-demo",
    personalEnabled: false,
    setPersonalEnabled: () => {},
    priorityEnabled: false,
    setPriorityEnabled: () => {},
    personalTippingEnabled: false,
    setPersonalTippingEnabled: () => {},
    minPriorityTipCents: 5000,
    hasStripeAccount: true,
  },
};

export const BothQueuesEnabled: Story = {
  args: {
    queueSnapshot: sampleQueueSnapshot,
    toggleQueue: mockToggleQueue,
    slug: "creator-demo",
    personalEnabled: true,
    setPersonalEnabled: () => {},
    priorityEnabled: true,
    setPriorityEnabled: () => {},
    personalTippingEnabled: true,
    setPersonalTippingEnabled: () => {},
    minPriorityTipCents: 5000,
    hasStripeAccount: true,
  },
};

export const BothQueuesDisabled: Story = {
  args: {
    queueSnapshot: disabledQueueSnapshot,
    toggleQueue: mockToggleQueue,
    slug: "creator-demo",
    personalEnabled: false,
    setPersonalEnabled: () => {},
    priorityEnabled: false,
    setPriorityEnabled: () => {},
    personalTippingEnabled: false,
    setPersonalTippingEnabled: () => {},
    minPriorityTipCents: 5000,
    hasStripeAccount: false,
  },
};

export const PersonalOnlyEnabled: Story = {
  args: {
    queueSnapshot: {
      ...sampleQueueSnapshot,
      priority: {
        ...sampleQueueSnapshot.priority,
        enabled: false,
      },
    },
    toggleQueue: mockToggleQueue,
    slug: "creator-demo",
    personalEnabled: true,
    setPersonalEnabled: () => {},
    priorityEnabled: false,
    setPriorityEnabled: () => {},
    minPriorityTipCents: 5000,
  },
};

export const PriorityOnlyEnabled: Story = {
  args: {
    queueSnapshot: {
      ...sampleQueueSnapshot,
      personal: {
        ...sampleQueueSnapshot.personal,
        enabled: false,
      },
    },
    toggleQueue: mockToggleQueue,
    slug: "creator-demo",
    personalEnabled: false,
    setPersonalEnabled: () => {},
    priorityEnabled: true,
    setPriorityEnabled: () => {},
    minPriorityTipCents: 5000,
  },
};

export const WithAutoqueueCardToggle: Story = {
  args: {
    queueSnapshot: sampleQueueSnapshot,
    toggleQueue: mockToggleQueue,
    slug: "creator-demo",
    personalEnabled: true,
    setPersonalEnabled: () => {},
    priorityEnabled: true,
    setPriorityEnabled: () => {},
    showAutoqueueCard: true,
    onToggleAutoqueueCard: () => {},
    minPriorityTipCents: 5000,
  },
};

export const HighMinimumFee: Story = {
  args: {
    queueSnapshot: sampleQueueSnapshot,
    toggleQueue: mockToggleQueue,
    slug: "creator-demo",
    personalEnabled: true,
    setPersonalEnabled: () => {},
    priorityEnabled: true,
    setPriorityEnabled: () => {},
    minPriorityTipCents: 25000, // $250
  },
};

export const LowMinimumFee: Story = {
  args: {
    queueSnapshot: sampleQueueSnapshot,
    toggleQueue: mockToggleQueue,
    slug: "creator-demo",
    personalEnabled: true,
    setPersonalEnabled: () => {},
    priorityEnabled: true,
    setPriorityEnabled: () => {},
    minPriorityTipCents: 100, // $1
  },
};

export const DefaultMinimumFee: Story = {
  args: {
    queueSnapshot: sampleQueueSnapshot,
    toggleQueue: mockToggleQueue,
    slug: "creator-demo",
    personalEnabled: true,
    setPersonalEnabled: () => {},
    priorityEnabled: true,
    setPriorityEnabled: () => {},
    minPriorityTipCents: 0, // Will default to $50
  },
};
