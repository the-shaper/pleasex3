import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import TaskModule from "./taskModule";
import type { TaskCardData } from "../../taskcard";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const baseData: TaskCardData = {
  currentTurn: 46,
  nextTurn: 33,
  etaMins: 90,
  activeCount: 120,
  enabled: true,
  name: "Daniel Arnoldo",
  email: "bajamana@gmail.com",
  phone: "+1 (555) 123-4567",
  needText: "Color Correct My Image", // Short title, mimicking taskTitle mapping
  message:
    "I really like this image for my website but I feel like adjusting its colors could significantly enhance it. Think you could help me with that?", // Detailed description, mimicking message mapping
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
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      const client = new ConvexReactClient("http://localhost:3001");
      return (
        <ConvexProvider client={client}>
          <Story />
        </ConvexProvider>
      );
    },
  ],
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
    title: "Personal Queue - Current Task",
    data: baseData,
  },
};

export const PriorityAwaitingFeedback: Story = {
  args: {
    title: "Priority Queue - Awaiting Feedback",
    data: {
      ...baseData,
      queueKind: "priority",
      tags: ["awaiting-feedback"],
      status: "awaiting-feedback",
      tipCents: 2500,
      ref: "PRIO-CLR-009",
      // Override for demo: Slightly different title/description to show variety
      needText: "High-Priority Color Pass",
      message:
        "This is a high-priority image that needs a quick color adjustment pass before final delivery.",
    },
  },
};

export const Finished: Story = {
  args: {
    title: "Finished Task",
    data: {
      ...baseData,
      tags: ["finished"],
      status: "finished",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
      ref: "DONE-CLR-021",
      // Override for demo: Completed task with its own title/description
      needText: "Color Correction Delivered",
      message:
        "The color adjustments have been applied and the image is ready for the client website.",
    },
  },
};
