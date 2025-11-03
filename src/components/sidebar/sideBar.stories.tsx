import type { Meta, StoryObj } from "@storybook/react";
import { SideBar } from "./sideBar";

const meta: Meta<typeof SideBar> = {
  title: "Components/Sidebar/SideBar",
  component: SideBar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    sections: {
      control: "object",
      description: "Array of sections with title and links",
    },
    initialActiveLink: {
      control: "text",
    },
    currentTab: {
      control: "text",
    },
    isOpen: {
      control: "boolean",
      description: "Visibility for mobile overlay",
    },
    onClose: {
      action: "closed",
    },
    mobileOverlay: {
      control: "boolean",
      description: "Enable mobile overlay mode",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock sections data
const mockSections = [
  {
    title: "Navigation",
    links: [
      { href: "/", label: "Home" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Settings",
    links: [
      { href: "/settings", label: "Profile" },
      { href: "/queue", label: "Queues" },
    ],
  },
];

export const Default: Story = {
  args: {
    sections: mockSections,
    initialActiveLink: "/",
  },
};

export const MobileClosed: Story = {
  args: {
    ...Default.args,
    mobileOverlay: true,
    isOpen: false,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const MobileOpen: Story = {
  args: {
    ...Default.args,
    mobileOverlay: true,
    isOpen: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
