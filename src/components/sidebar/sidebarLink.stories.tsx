import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SidebarLink } from "./sidebarLink";

const meta: Meta<typeof SidebarLink> = {
  component: SidebarLink,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof SidebarLink>;

export const Default: Story = {
  args: {
    href: "/",
    label: "Home",
  },
};

export const Active: Story = {
  args: {
    href: "/active",
    label: "Active Link",
    isActive: true, // Explicitly set for testing
  },
};

export const Inactive: Story = {
  args: {
    href: "/inactive",
    label: "Inactive Link",
    isActive: false, // Explicitly set for testing
  },
};
