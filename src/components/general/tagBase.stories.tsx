import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { TagBase } from "./tagBase";

const meta: Meta<typeof TagBase> = {
  component: TagBase,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: [
        "attn",
        "neutral",
        "priority",
        "personal",
        "pending",
        "next-up",
        "awaiting-feedback",
        "finished",
        "current",
      ],
    },
  },
};

export default meta;

type Story = StoryObj<typeof TagBase>;

export const Default: Story = {
  args: {
    children: "Default Tag",
  },
};

export const Attn: Story = {
  args: {
    variant: "attn",
    children: "Attention",
  },
};

export const Neutral: Story = {
  args: {
    variant: "neutral",
    children: "Neutral",
  },
};

export const Priority: Story = {
  args: {
    variant: "priority",
    children: "Priority",
  },
};

export const Personal: Story = {
  args: {
    variant: "personal",
    children: "Personal",
  },
};

export const Pending: Story = {
  args: {
    variant: "pending",
    children: "Pending",
  },
};

export const NextUp: Story = {
  args: {
    variant: "next-up",
    children: "Next Up",
  },
};

export const AwaitingFeedback: Story = {
  args: {
    variant: "awaiting-feedback",
    children: "Awaiting Feedback",
  },
};

export const Finished: Story = {
  args: {
    variant: "finished",
    children: "Finished",
  },
};

export const Current: Story = {
  args: {
    variant: "current",
    children: "Current",
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Add Item
      </>
    ),
  },
};

// Story showing all variants in a grid
const AllVariantsGrid = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text">All Tag Variants</h3>
      <div className="flex gap-2 flex-wrap">
        <TagBase variant="attn">Attention</TagBase>
        <TagBase variant="neutral">Neutral</TagBase>
        <TagBase variant="priority">Priority</TagBase>
        <TagBase variant="personal">Personal</TagBase>
        <TagBase variant="pending">Pending</TagBase>
        <TagBase variant="next-up">Next Up</TagBase>
        <TagBase variant="awaiting-feedback">Awaiting Feedback</TagBase>
        <TagBase variant="finished">Finished</TagBase>
        <TagBase variant="current">Current</TagBase>
      </div>
    </div>
  </div>
);

export const AllVariants: Story = {
  render: () => <AllVariantsGrid />,
};
