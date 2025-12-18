import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { fn } from "storybook/test";

import CheckoutDonation from "../components/checkout/checkoutDonation";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Components/General/CheckoutDonation",
  component: CheckoutDonation,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    isPriority: {
      control: "boolean",
      description:
        "Determines if this is a priority donation (affects styling colors)",
    },
    tipDollarsInt: {
      control: "number",
      description: "The tip amount in dollars to display in the input",
    },
    minPriorityTipCents: {
      control: "number",
      description:
        "Minimum tip required for priority in cents (0 means no minimum)",
    },
    priorityTipCents: {
      control: "number",
      description: "Current tip amount in cents",
    },
    onChangeTip: {
      action: "tip changed",
      description: "Callback when tip amount changes",
    },
  },
  // Use `fn` to spy on the onChangeTip arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onChangeTip: fn() },
} satisfies Meta<typeof CheckoutDonation>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Personal: Story = {
  args: {
    isPriority: false,
    tipDollarsInt: 5,
    minPriorityTipCents: 500, // $5 minimum for priority
    priorityTipCents: 500,
  },
};

export const Priority: Story = {
  args: {
    isPriority: true,
    tipDollarsInt: 10,
    minPriorityTipCents: 500, // $5 minimum for priority
    priorityTipCents: 1000,
  },
};

export const NoMinimum: Story = {
  args: {
    isPriority: false,
    tipDollarsInt: 0,
    minPriorityTipCents: 0, // No minimum required
    priorityTipCents: 0,
  },
};

export const ZeroTip: Story = {
  args: {
    isPriority: false,
    tipDollarsInt: 0,
    minPriorityTipCents: 200, // $2 minimum for priority
    priorityTipCents: 0,
  },
};
