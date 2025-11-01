import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import TaskModule from "./taskModule";
import type { TaskCardData } from "../../taskcard";

const baseData: TaskCardData = {
  currentTurn: 46,
  nextTurn: 33,
  etaMins: 90,
  activeCount: 120,
  enabled: true,
  name: "Daniel Arnoldo",
  email: "bajamana@gmail.com",
  phone: "+1 (555) 123-4567",
  needText:
    "I really like this image for my website but I feel like adjusting its colors could significantly enhance it. Think you could help me with that?",
  attachments: ["https://url.com"],
  tipCents: 500,
  queueKind: "personal",
  status: "current",
  tags: ["current"],
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
  ref: "IMG-COLOR-001",
};

const meta = {
  title: "Components/Dashboard/TaskModule",
  component: TaskModule,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onSendForFeedback: { action: "sendForFeedback" },
    onMarkAsFinished: { action: "markAsFinished" },
    title: { control: "text" },
    data: { control: "object" },
  },
} satisfies Meta<typeof TaskModule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PersonalCurrent: Story = {
  args: {
    title: "Color Correct My Image",
    data: baseData,
  },
};

export const PriorityAwaitingFeedback: Story = {
  args: {
    title: "High-priority Color Pass",
    data: {
      ...baseData,
      queueKind: "priority",
      tags: ["awaiting-feedback"],
      status: "awaiting-feedback",
      tipCents: 2500,
      ref: "PRIO-CLR-009",
    },
  },
};

export const Finished: Story = {
  args: {
    title: "Color Correction Delivered",
    data: {
      ...baseData,
      tags: ["finished"],
      status: "finished",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
      ref: "DONE-CLR-021",
    },
  },
};
