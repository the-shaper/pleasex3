import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PayoutsCard } from "./PayoutsCard";

const meta: Meta<typeof PayoutsCard> = {
  title: "Components/Dashboard/Earnings/PayoutsCard",
  component: PayoutsCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

type Story = StoryObj<typeof PayoutsCard>;

const history = [
  {
    id: "payout-past-1",
    creatorSlug: "demo",
    periodStart: Date.UTC(2025, 9, 1),
    periodEnd: Date.UTC(2025, 10, 1),
    grossCents: 80000,
    platformFeeCents: 2640,
    payoutCents: 77360,
    currency: "usd",
    status: "paid",
    createdAt: Date.now() - 1000,
  },
  {
    id: "payout-past-2",
    creatorSlug: "demo",
    periodStart: Date.UTC(2025, 8, 1),
    periodEnd: Date.UTC(2025, 9, 1),
    grossCents: 45000,
    platformFeeCents: 1485,
    payoutCents: 43515,
    currency: "usd",
    status: "paid",
    createdAt: Date.now() - 2000,
  },
];

export const Default: Story = {
  args: {
    upcomingPayout: {
      id: "payout-next",
      creatorSlug: "demo",
      periodStart: Date.UTC(2025, 10, 1),
      periodEnd: Date.UTC(2025, 11, 1),
      grossCents: 120000,
      platformFeeCents: 3960,
      payoutCents: 116040,
      currency: "usd",
      status: "pending",
      stripeTransferId: "tr_demo_abcdef",
      createdAt: Date.now(),
    },
    payoutHistory: history,
  },
};

export const Empty: Story = {
  args: {
    upcomingPayout: null,
    payoutHistory: [],
  },
};

export default meta;

