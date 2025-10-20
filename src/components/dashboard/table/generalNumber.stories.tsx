import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { GeneralNumber } from "./generalNumber";

const meta: Meta<typeof GeneralNumber> = {
  component: GeneralNumber,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "active"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof GeneralNumber>;

export const Default: Story = {
  args: {
    data: { activeTurn: 42 },
    variant: "default",
  },
};

export const Active: Story = {
  args: {
    data: { activeTurn: 7 },
    variant: "active",
  },
};
