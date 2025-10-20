import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SideBar } from "./sideBar";

const meta: Meta<typeof SideBar> = {
  component: SideBar,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof SideBar>;

export const Default: Story = {
  render: () => <SideBar />,
};
