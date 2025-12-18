import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import QueueCard from "./QueueCard";

const meta: Meta<typeof QueueCard> = {
  title: "Components/QueueCard",
  component: QueueCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Queue Card is the main component for the creator's public page. It displays queue status, next ticket number and ETA, for both personal and priority queues.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    kind: {
      control: { type: "select" },
      options: ["personal", "priority"],
    },
    slug: {
      control: { type: "text" },
    },
    minPriorityTipCents: {
      control: { type: "number" },
    },
    nextTicketNumber: {
      control: { type: "number" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PersonalQueueEnabled: Story = {
  args: {
    kind: "personal",
    slug: "example-creator",
    data: {
      currentTicketNumber: 42,
      nextTicketNumber: 43,
      etaDays: 3,
      avgDaysPerTicket: 2.5,
      enabled: true,
      tippingEnabled: true,
    },
    minPriorityTipCents: 500,
    nextTicketNumber: 43,
  },
};

export const PersonalQueueNoTipping: Story = {
  args: {
    kind: "personal",
    slug: "example-creator",
    data: {
      currentTicketNumber: 15,
      nextTicketNumber: 16,
      etaDays: 1,
      avgDaysPerTicket: 1.2,
      enabled: true,
      tippingEnabled: false,
    },
    minPriorityTipCents: 500,
    nextTicketNumber: 16,
  },
};

export const PriorityQueueEnabled: Story = {
  args: {
    kind: "priority",
    slug: "example-creator",
    data: {
      currentTicketNumber: 8,
      nextTicketNumber: 9,
      etaDays: 1,
      avgDaysPerTicket: 0.8,
      enabled: true,
      tippingEnabled: true,
    },
    minPriorityTipCents: 1000,
    nextTicketNumber: 9,
  },
};

export const QueueDisabled: Story = {
  args: {
    kind: "personal",
    slug: "example-creator",
    data: {
      currentTicketNumber: 23,
      nextTicketNumber: 24,
      etaDays: null,
      avgDaysPerTicket: 3.1,
      enabled: false,
      tippingEnabled: true,
    },
    minPriorityTipCents: 500,
    nextTicketNumber: 24,
  },
};

export const MinimalData: Story = {
  args: {
    kind: "personal",
    slug: "example-creator",
    data: {
      enabled: true,
      etaDays: null,
    },
    minPriorityTipCents: 500,
  },
};

export const HighPriorityTip: Story = {
  args: {
    kind: "priority",
    slug: "example-creator",
    data: {
      currentTicketNumber: 1,
      nextTicketNumber: 2,
      etaDays: 0.5,
      avgDaysPerTicket: 0.3,
      enabled: true,
      tippingEnabled: true,
    },
    minPriorityTipCents: 2500,
    nextTicketNumber: 2,
  },
};