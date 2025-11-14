import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EarningsSummaryCard } from "./EarningsSummaryCard";

const meta: Meta<typeof EarningsSummaryCard> = {
  title: "Components/Dashboard/Earnings/EarningsSummaryCard",
  component: EarningsSummaryCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

type Story = StoryObj<typeof EarningsSummaryCard>;

const currentPeriod = {
  creatorSlug: "demo",
  periodStart: Date.UTC(2025, 10, 1),
  periodEnd: Date.UTC(2025, 11, 1),
  grossCents: 97000,
  thresholdCents: 5000,
  platformFeeRateBps: 330,
  platformFeeCents: 3201,
  payoutCents: 93799,
  thresholdReached: true,
};

const lastThree = [
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
];

export const Default: Story = {
  args: {
    currentPeriod,
    lastThreePeriods: lastThree,
    allTimeGrossCents: 450000,
    allTimePlatformFeeCents: 14850,
    allTimePayoutCents: 435150,
  },
};

export default meta;

