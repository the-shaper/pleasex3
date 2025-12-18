import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ConnectStripeCard } from "./ConnectStripeCard";

const meta: Meta<typeof ConnectStripeCard> = {
  title: "Components/Dashboard/Earnings/ConnectStripeCard",
  component: ConnectStripeCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

type Story = StoryObj<typeof ConnectStripeCard>;

export const Disconnected: Story = {
  args: {
    connection: { connected: false },
  },
};

export const Connected: Story = {
  args: {
    connection: {
      connected: true,
      stripeAccountId: "acct_storybook_987654",
      detailsSubmitted: true,
    },
  },
};

export default meta;

