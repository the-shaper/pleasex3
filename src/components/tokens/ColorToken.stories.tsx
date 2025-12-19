import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { ColorToken } from "./ColorToken";

const meta = {
  title: "Tokens/ColorToken",
  component: ColorToken,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ColorToken>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTokens: Story = {
  args: {
    name: "Text",
    variable: "text",
    description: "Primary text color",
  },
  render: () => (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-heading font-semibold text-text mb-4">
        All Color Tokens
      </h3>
      <p className="text-text-muted mb-4">
        Click on any color swatch or value to copy it. The component will show a
        "Copied!" message.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ColorToken
          name="Text"
          variable="text"
          description="Paragraph normal"
        />
        <ColorToken
          name="Text Bright"
          variable="text-bright"
          description="Bright text"
        />
        <ColorToken
          name="Text Muted"
          variable="text-muted"
          description="Lighter dark"
        />
        <ColorToken
          name="Gray Subtle"
          variable="gray-subtle"
          description="Subtle gray"
        />
        <ColorToken
          name="Background"
          variable="bg"
          description="Main background"
        />
        <ColorToken
          name="Green Lite"
          variable="greenlite"
          description="Greenielo"
        />
        <ColorToken name="Coral" variable="coral" description="Coral red" />
        <ColorToken name="Pink" variable="pink" description="Light pink" />
        <ColorToken name="Gold" variable="gold" description="UI gold" />
        <ColorToken name="Ielo" variable="ielo" description="UI gold" />
        <ColorToken name="Purple" variable="purple" description="Purple" />
        <ColorToken name="Blue" variable="blue" description="Big blu" />
        <ColorToken name="Blue 2" variable="blue-2" description="Other blu" />
        <ColorToken
          name="Background Pink"
          variable="bg-pink"
          description="Background pink"
        />
      </div>
    </div>
  ),
};

export const WithDescription: Story = {
  args: {
    name: "Background",
    variable: "bg",
    description: "Main background color for the application",
  },
};

export const WithoutUsage: Story = {
  args: {
    name: "Coral",
    variable: "coral",
    description: "Coral red accent color",
    showUsage: false,
  },
};
