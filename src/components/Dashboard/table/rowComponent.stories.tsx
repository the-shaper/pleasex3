import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RowComponent, type RowComponentData } from "./rowComponent";

const meta: Meta<typeof RowComponent> = {
  component: RowComponent,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Row component for the table. Displays a single row with ticket information.",
      },
    },
  },
  argTypes: {
    data: {
      control: { type: "object" },
    },
    onOpen: { action: "opened" },
  },
};

export default meta;

type Story = StoryObj<typeof RowComponent>;

// Mock data for different scenarios
const mockData: Record<string, RowComponentData> = {
  openPersonal: {
    generalNumber: 5,
    ticketNumber: 3,
    queueKind: "personal",
    task: "Please help me with my website design",
    submitterName: "Alice Johnson",
    requestDate: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    ref: "DEMO-12345",
    status: "open",
  },
  openPriority: {
    generalNumber: 2,
    ticketNumber: 1,
    queueKind: "priority",
    task: "Urgent: Fix broken payment system",
    submitterName: "Bob Smith",
    requestDate: Date.now() - 30 * 60 * 1000, // 30 minutes ago
    ref: "DEMO-12346",
    status: "open",
  },
  approvedTicket: {
    generalNumber: 12,
    ticketNumber: 8,
    queueKind: "personal",
    task: "Logo design for my startup",
    submitterName: "Carol Davis",
    requestDate: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    ref: "DEMO-12347",
    status: "approved",
  },
  rejectedTicket: {
    generalNumber: 15,
    ticketNumber: 5,
    queueKind: "priority",
    task: "Mobile app development consultation",
    submitterName: "David Wilson",
    requestDate: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    ref: "DEMO-12348",
    status: "rejected",
  },
  longText: {
    generalNumber: 8,
    ticketNumber: 4,
    queueKind: "personal",
    task: "This is a very long task description that should be truncated in the UI but show full text on hover tooltip when you hover over it",
    submitterName: "Dr. Elizabeth Montgomery Williams III",
    requestDate: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
    ref: "DEMO-12349",
    status: "open",
  },
};

export const OpenPersonalTicket: Story = {
  args: {
    data: mockData.openPersonal,
  },
};

export const OpenPriorityTicket: Story = {
  args: {
    data: mockData.openPriority,
  },
};

export const ApprovedTicket: Story = {
  args: {
    data: mockData.approvedTicket,
  },
};

export const RejectedTicket: Story = {
  args: {
    data: mockData.rejectedTicket,
  },
};

export const LongTextTruncation: Story = {
  args: {
    data: mockData.longText,
  },
};

export const WithCustomHandler: Story = {
  args: {
    data: mockData.openPersonal,
    onOpen: (ref: string) => {
      console.log(`Opening ticket: ${ref}`);
      alert(`Opening ticket: ${ref}`);
    },
  },
};
