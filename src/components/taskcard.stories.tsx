import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import TaskCard, { TaskCardData } from "./taskcard";

// Base data template for consistent examples
const baseData = {
  currentTurn: 5,
  nextTurn: 6,
  etaDays: 30,
  activeCount: 2,
  enabled: true,
  name: "Morgan Smith",
  email: "morgan.smith@company.com",
  phone: "+1 (555) 987-6543",
  needText:
    "Need help debugging a critical production issue in our React application. The error occurs when users try to upload large files. We've identified it's related to memory management but need expert help to fix it quickly.",
  message:
    "Need help debugging a critical production issue in our React application. The error occurs when users try to upload large files. We've identified it's related to memory management but need expert help to fix it quickly.",
  attachments: [
    "https://example.com/error-logs.txt",
    "https://github.com/company/app/issues/123",
  ],
  tipCents: 2500, // $25
  createdAt: Date.now() - 1800000, // 30 minutes ago
  ref: "PRIO-006",
};

// Status-specific data examples
const currentStatusData: TaskCardData = {
  ...baseData,
  tags: ["current"],
  status: "current",
  ref: "CURR-001",
};

const nextUpStatusData: TaskCardData = {
  ...baseData,
  tags: ["next-up"],
  status: "next-up",
  ref: "NEXT-002",
};

const attnStatusData: TaskCardData = {
  ...baseData,
  tags: ["attn"],
  status: "attn",
  ref: "ATTN-003",
};

const awaitingFeedbackStatusData: TaskCardData = {
  ...baseData,
  tags: ["awaiting-feedback"],
  status: "awaiting-feedback",
  ref: "WAIT-004",
};

const finishedStatusData: TaskCardData = {
  ...baseData,
  tags: ["finished"],
  status: "finished",
  activeCount: 0,
  ref: "DONE-005",
};

const pendingStatusData: TaskCardData = {
  ...baseData,
  tags: ["pending"],
  status: "pending",
  ref: "PEND-006",
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Components/Dashboard/TaskCard",
  component: TaskCard,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
    docs: {
      description: {
        component:
          "TaskCard component used on dashboard. Displays a preview a task/ticket with essential information.",
      },
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: {
      control: "select",
      options: ["priority", "personal"],
      description: "The variant of the TaskCard component",
    },
    data: {
      control: "object",
      description: "The data object containing ticket information",
    },
  },
} satisfies Meta<typeof TaskCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args

// Status-based stories organized by priority

export const Current: Story = {
  args: {
    variant: "priority",
    data: currentStatusData,
    isActive: true,
  },
};

export const NextUp: Story = {
  args: {
    variant: "priority",
    data: nextUpStatusData,
  },
};

export const Attention: Story = {
  args: {
    variant: "priority",
    data: attnStatusData,
  },
};

export const AwaitingFeedback: Story = {
  args: {
    variant: "personal",
    data: awaitingFeedbackStatusData,
  },
};

export const Finished: Story = {
  args: {
    variant: "personal",
    data: finishedStatusData,
  },
};

export const Pending: Story = {
  args: {
    variant: "personal",
    data: pendingStatusData,
  },
};
