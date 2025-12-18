import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SidebarSection } from "./sidebarSection";
import { SidebarLink } from "./sidebarLink";
import { useState } from "react";

const meta: Meta<typeof SidebarSection> = {
  title: "Components/Dashboard/Sidebar/SidebarSection",
  component: SidebarSection,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof SidebarSection>;

export const Default: Story = {
  args: {
    title: "Navigation",
    children: (
      <>
        <SidebarLink href="/" label="Home" isActive={true} />
        <SidebarLink href="/about" label="About" isActive={false} />
        <SidebarLink href="/contact" label="Contact" isActive={false} />
      </>
    ),
  },
};

export const WithMultipleSections: Story = {
  args: {
    title: "Dashboard",
    children: (
      <>
        <SidebarLink href="/dashboard" label="Overview" isActive={true} />
        <SidebarLink href="/analytics" label="Analytics" isActive={false} />
        <SidebarLink href="/settings" label="Settings" isActive={false} />
      </>
    ),
  },
};

// Story demonstrating click-based active state
const InteractiveSidebar = () => {
  const [activeLink, setActiveLink] = useState<string>("/");

  return (
    <SidebarSection title="Interactive Navigation">
      <SidebarLink
        href="/"
        label="Home"
        isActive={activeLink === "/"}
        onClick={() => setActiveLink("/")}
      />
      <SidebarLink
        href="/about"
        label="About"
        isActive={activeLink === "/about"}
        onClick={() => setActiveLink("/about")}
      />
      <SidebarLink
        href="/contact"
        label="Contact"
        isActive={activeLink === "/contact"}
        onClick={() => setActiveLink("/contact")}
      />
    </SidebarSection>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveSidebar />,
};
