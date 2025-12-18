import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import TaskCard, { TaskCardData } from "./taskcard";



const priorityData: TaskCardData = {
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
  status: "next-up",
  createdAt: Date.now() - 1800000, // 30 minutes ago
  ref: "PRIO-006",
};

const personalData: TaskCardData = {
  currentTurn: 17,
  nextTurn: 18,
  etaDays: 90,
  activeCount: 5,
  enabled: true,
  name: "Taylor Wilson",
  email: "taylor.wilson@email.com",
  needText:
    "Looking for recommendations for beginner-friendly houseplants that are low maintenance and safe for cats. I have a north-facing apartment with limited natural light.",
  message:
    "Looking for recommendations for beginner-friendly houseplants that are low maintenance and safe for cats. I have a north-facing apartment with limited natural light.",
  attachments: [],
  tipCents: 0,
  status: "pending",
  createdAt: Date.now() - 7200000, // 2 hours ago
  ref: "PERS-018",
};

const finishedData: TaskCardData = {
  currentTurn: 12,
  nextTurn: 13,
  etaDays: 60,
  activeCount: 0,
  enabled: true,
  name: "Casey Rivera",
  email: "casey.rivera@email.com",
  needText:
    "Help me choose a new laptop for web development work. Budget is around $1500, need good battery life and a comfortable keyboard.",
  message:
    "Help me choose a new laptop for web development work. Budget is around $1500, need good battery life and a comfortable keyboard.",
  attachments: ["https://example.com/laptop-options.docx"],
  tipCents: 1500, // $15
  status: "finished",
  createdAt: Date.now() - 86400000, // 1 day ago
  ref: "PERS-013",
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Components/Dashboard/TaskCard",
  component: TaskCard,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
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

export const Priority: Story = {
  args: {
    variant: "priority",
    data: priorityData,
  },
};

export const Personal: Story = {
  args: {
    variant: "personal",
    data: personalData,
  },
};

export const Finished: Story = {
  args: {
    variant: "personal",
    data: finishedData,
  },
};
