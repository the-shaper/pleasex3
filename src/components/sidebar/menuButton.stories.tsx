import type { Meta, StoryObj } from "@storybook/react";
import { MenuButton } from "./menuButton";

const meta: Meta<typeof MenuButton> = {
  title: "Components/Dashboard/Sidebar/MenuButton",
  component: MenuButton,
  parameters: {
    layout: "centered",
    viewport: {
      defaultViewport: "mobile1",
    },
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
  decorators: [
    (Story) => (
      <div className="p-4 [&_button]:!block [&_button]:md:!block">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: false,
  },
};

export const Close: Story = {
  args: {
    isOpen: true,
  },
};
