import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { ButtonBase } from "./buttonBase";

const meta: Meta<typeof ButtonBase> = {
  component: ButtonBase,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "primary", "secondary", "ghost", "outline"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "default", "lg"],
    },
    loading: {
      control: { type: "boolean" },
    },
    disabled: {
      control: { type: "boolean" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ButtonBase>;

export const Default: Story = {
  args: {
    children: "Default Button",
  },
};

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Button",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: "Loading Button",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg
          className="w-4 h-4"
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

// Interactive story demonstrating loading state toggle
const LoadingToggleButton = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <ButtonBase loading={isLoading} onClick={handleClick} variant="primary">
      {isLoading ? "Processing..." : "Click to Load"}
    </ButtonBase>
  );
};

export const InteractiveLoading: Story = {
  render: () => <LoadingToggleButton />,
};

// Story showing all variants in a grid
const AllVariantsGrid = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text">Variants</h3>
      <div className="flex gap-2 flex-wrap">
        <ButtonBase variant="default">Default</ButtonBase>
        <ButtonBase variant="primary">Primary</ButtonBase>
        <ButtonBase variant="secondary">Secondary</ButtonBase>
        <ButtonBase variant="ghost">Ghost</ButtonBase>
        <ButtonBase variant="outline">Outline</ButtonBase>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text">Sizes</h3>
      <div className="flex gap-2 items-center">
        <ButtonBase size="sm">Small</ButtonBase>
        <ButtonBase size="default">Default</ButtonBase>
        <ButtonBase size="lg">Large</ButtonBase>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text">States</h3>
      <div className="flex gap-2 flex-wrap">
        <ButtonBase disabled>Disabled</ButtonBase>
        <ButtonBase loading>Loading</ButtonBase>
      </div>
    </div>
  </div>
);

export const AllVariants: Story = {
  render: () => <AllVariantsGrid />,
};
