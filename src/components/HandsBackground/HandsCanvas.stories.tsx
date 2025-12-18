import type { Meta, StoryObj } from "@storybook/react";
import { HandsCanvas } from "./HandsCanvas";
import { defaultSettings } from "./config";
import { fn } from "storybook/test";

const meta: Meta<typeof HandsCanvas> = {
  title: "Components/Swagger/HandsCanvas",
  component: HandsCanvas,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage background. Simple Javascript canvas that brings two svg images together at the vertical center of the screen and apart when the cursor moves away towards top or bottom. It is activated after moving the cursor past the bottom half of the screen.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    settings: {
      control: "object",
      description:
        "Configuration for hands animation including positions, rotations, and display options",
    },
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the canvas element",
    },
    onCanvasReady: {
      action: "canvas ready",
      description: "Callback fired when the canvas element is ready",
    },
  },
  args: {
    onCanvasReady: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    settings: defaultSettings,
  },
};

export const WithCircles: Story = {
  args: {
    settings: {
      ...defaultSettings,
      showCircles: true,
    },
  },
};

export const WithPath: Story = {
  args: {
    settings: {
      ...defaultSettings,
      showPath: true,
    },
  },
};

export const WithCirclesAndPath: Story = {
  args: {
    settings: {
      ...defaultSettings,
      showCircles: true,
      showPath: true,
    },
  },
};

export const CustomSpread: Story = {
  args: {
    settings: {
      ...defaultSettings,
      global: {
        ...defaultSettings.global,
        spreadFactor: 0.5,
      },
    },
  },
};

export const WideSpread: Story = {
  args: {
    settings: {
      ...defaultSettings,
      global: {
        ...defaultSettings.global,
        spreadFactor: 2.5,
      },
    },
  },
};

export const DifferentAngle: Story = {
  args: {
    settings: {
      ...defaultSettings,
      global: {
        ...defaultSettings.global,
        pathAngle: 90,
      },
    },
  },
};
