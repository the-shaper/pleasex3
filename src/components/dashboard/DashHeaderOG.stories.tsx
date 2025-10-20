import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DashboardHeader from "./DashHeaderOG";

const meta: Meta<typeof DashboardHeader> = {
  component: DashboardHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    title: {
      control: { type: "text" },
      description: "The main title displayed in the header",
    },
    username: {
      control: { type: "text" },
      description: "The username displayed below the title",
    },
    onMenuClick: { action: "menu-clicked" },
    className: {
      control: { type: "text" },
      description: "Additional CSS classes",
    },
  },
};

export default meta;

type Story = StoryObj<typeof DashboardHeader>;

export const Default: Story = {
  args: {},
};

export const CustomTitle: Story = {
  args: {
    title: "Custom Dashboard Title",
  },
};

export const CustomUsername: Story = {
  args: {
    username: "john.doe@example.com",
  },
};

export const WithCustomContent: Story = {
  args: {
    title: "My Awesome Dashboard",
    username: "admin@company.com",
  },
};

export const WithMenuClick: Story = {
  args: {
    title: "Interactive Dashboard",
    username: "user@pleasex3.com",
    onMenuClick: () => {
      console.log("Menu clicked!");
      alert("Menu button clicked!");
    },
  },
};

// Story showing the component in a typical dashboard layout context
const DashboardLayoutExample = () => (
  <div className="bg-bg p-8 min-h-screen">
    <DashboardHeader
      title="PLEASE PLEASE PLEASE"
      username="demo.user@convex.dev"
    />
    <div className="mt-8">
      <p className="text-text-muted">Dashboard content would go here...</p>
    </div>
  </div>
);

export const InDashboardLayout: Story = {
  render: () => <DashboardLayoutExample />,
};
