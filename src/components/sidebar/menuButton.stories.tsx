import type { Meta, StoryObj } from "@storybook/react";
import { MenuButton } from "./menuButton";

const meta: Meta<typeof MenuButton> = {
  title: "Components/Sidebar/MenuButton",
  component: MenuButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onClick: {
      action: "clicked",
    },
    isOpen: {
      control: "boolean",
      description: "Whether the sidebar is open (shows X icon)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: false,
  },
};

export const Open: Story = {
  args: {
    isOpen: true,
  },
};
