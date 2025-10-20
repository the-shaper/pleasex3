import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TableComponent, type CellComponentData } from "./tableComponent";

const meta: Meta<typeof TableComponent> = {
  component: TableComponent,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    data: {
      control: { type: "object" },
    },
    onOpen: { action: "opened" },
  },
};

export default meta;

type Story = StoryObj<typeof TableComponent>;

// Mock data for different scenarios
const mockData: CellComponentData[] = [
  {
    generalNumber: 5,
    ticketNumber: 3,
    queueKind: "personal",
    task: "Please help me with my website design",
    submitterName: "Alice Johnson",
    requestDate: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    ref: "DEMO-12345",
    status: "open",
  },
  {
    generalNumber: 2,
    ticketNumber: 1,
    queueKind: "priority",
    task: "Urgent: Fix broken payment system",
    submitterName: "Bob Smith",
    requestDate: Date.now() - 30 * 60 * 1000, // 30 minutes ago
    ref: "DEMO-12346",
    status: "open",
  },
  {
    generalNumber: 12,
    ticketNumber: 8,
    queueKind: "personal",
    task: "Logo design for my startup",
    submitterName: "Carol Davis",
    requestDate: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    ref: "DEMO-12347",
    status: "approved",
  },
  {
    generalNumber: 8,
    ticketNumber: 4,
    queueKind: "personal",
    task: "Mobile app development consultation",
    submitterName: "David Wilson",
    requestDate: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
    ref: "DEMO-12348",
    status: "open",
  },
  {
    generalNumber: 15,
    ticketNumber: 5,
    queueKind: "priority",
    task: "Database optimization for e-commerce site",
    submitterName: "Emma Thompson",
    requestDate: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    ref: "DEMO-12349",
    status: "rejected",
  },
];

export const Default: Story = {
  args: {
    data: mockData,
  },
};

export const EmptyTable: Story = {
  args: {
    data: [],
  },
};

export const SingleRow: Story = {
  args: {
    data: [mockData[0]],
  },
};

export const ManyRows: Story = {
  args: {
    data: [
      ...mockData,
      {
        generalNumber: 20,
        ticketNumber: 10,
        queueKind: "personal",
        task: "SEO optimization for blog",
        submitterName: "Frank Miller",
        requestDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        ref: "DEMO-12350",
        status: "open",
      },
      {
        generalNumber: 18,
        ticketNumber: 6,
        queueKind: "priority",
        task: "API integration for third-party service",
        submitterName: "Grace Lee",
        requestDate: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
        ref: "DEMO-12351",
        status: "open",
      },
    ],
  },
};

export const WithCustomHandler: Story = {
  args: {
    data: mockData,
    onOpen: (ref: string) => {
      console.log(`Opening ticket: ${ref}`);
      alert(`Opening ticket: ${ref}`);
    },
  },
};

export const SortByGeneralNumber: Story = {
  args: {
    data: mockData,
  },
  play: async ({ canvasElement }) => {
    // Click the GENERAL header to sort
    const generalButton = canvasElement.querySelector(
      'button:has-text("GENERAL")'
    ) as HTMLButtonElement;
    if (generalButton) {
      generalButton.click();
    }
  },
};

export const SortByTicketNumber: Story = {
  args: {
    data: mockData,
  },
  play: async ({ canvasElement }) => {
    // Click the TICKET header to sort
    const ticketButton = canvasElement.querySelector(
      'button:has-text("TICKET")'
    ) as HTMLButtonElement;
    if (ticketButton) {
      ticketButton.click();
    }
  },
};

export const SortByDate: Story = {
  args: {
    data: mockData,
  },
  play: async ({ canvasElement }) => {
    // Click the REQUESTED ON header to sort
    const dateButton = canvasElement.querySelector(
      'button:has-text("REQUESTED ON")'
    ) as HTMLButtonElement;
    if (dateButton) {
      dateButton.click();
    }
  },
};
