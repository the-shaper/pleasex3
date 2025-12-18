import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EarningsPanel } from "./EarningsPanel";
import type { EarningsDashboardData } from "@/lib/types";

const sampleData: EarningsDashboardData = {
  connection: {
    connected: true,
    stripeAccountId: "acct_demo123456",
    detailsSubmitted: true,
  },
  currentPeriod: {
    creatorSlug: "demo",
    periodStart: Date.UTC(2025, 10, 1),
    periodEnd: Date.UTC(2025, 11, 1),
    grossCents: 97000,
    thresholdCents: 5000,
    platformFeeRateBps: 330,
    platformFeeCents: 3201,
    payoutCents: 93799,
    thresholdReached: true,
  },
  lastThreePeriods: [
    {
      creatorSlug: "demo",
      periodStart: Date.UTC(2025, 9, 1),
      periodEnd: Date.UTC(2025, 10, 1),
      grossCents: 120000,
      thresholdCents: 5000,
      platformFeeRateBps: 330,
      platformFeeCents: 3960,
      payoutCents: 116040,
      thresholdReached: true,
    },
    {
      creatorSlug: "demo",
      periodStart: Date.UTC(2025, 8, 1),
      periodEnd: Date.UTC(2025, 9, 1),
      grossCents: 83000,
      thresholdCents: 5000,
      platformFeeRateBps: 330,
      platformFeeCents: 2739,
      payoutCents: 80261,
      thresholdReached: true,
    },
    {
      creatorSlug: "demo",
      periodStart: Date.UTC(2025, 7, 1),
      periodEnd: Date.UTC(2025, 8, 1),
      grossCents: 47000,
      thresholdCents: 5000,
      platformFeeRateBps: 330,
      platformFeeCents: 1551,
      payoutCents: 45449,
      thresholdReached: true,
    },
  ],
  allTimeGrossCents: 450000,
  allTimePlatformFeeCents: 14850,
  allTimePayoutCents: 435150,
  upcomingPayout: {
    id: "payout-demo-01",
    creatorSlug: "demo",
    periodStart: Date.UTC(2025, 10, 1),
    periodEnd: Date.UTC(2025, 11, 1),
    grossCents: 120000,
    platformFeeCents: 3960,
    payoutCents: 116040,
    currency: "usd",
    stripeTransferId: "tr_demo_abcdef",
    status: "pending",
    createdAt: Date.now(),
  },
  payoutHistory: [
    {
      id: "payout-demo-00",
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
      id: "payout-demo-01",
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
  ],
};

const meta: Meta<typeof EarningsPanel> = {
  title: "Components/Dashboard/Earnings/Earnings Panel",
  component: EarningsPanel,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

type Story = StoryObj<typeof EarningsPanel>;

export const ConnectStripe: Story = {
  args: {
    data: {
      ...sampleData,
      connection: {
        connected: false,
        stripeAccountId: null,
        detailsSubmitted: false,
      },
    },
  },
};


export const Connected: Story = {
  args: {
    data: sampleData,
  },
};

export const Empty: Story = {
  args: {
    data: null,
  },
};


export default meta;

