import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { PrivacyModal } from "./privacyModal";
import { ButtonBase } from "./buttonBase";

const meta: Meta<typeof PrivacyModal> = {
  title: "Components/PrivacyModal",
  component: PrivacyModal,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: { type: "boolean" },
      description: "Controls whether the modal is visible",
    },
    onClose: {
      action: "closed",
      description: "Callback function when modal is closed",
    },
  },
};

export default meta;

type Story = StoryObj<typeof PrivacyModal>;

// Interactive story that allows opening and closing the modal
const ModalWithTrigger = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold text-text mb-4">
          Privacy Policy Modal Demo
        </h1>
        <p className="text-text-muted mb-8">
          Click the button below to open the Privacy Policy modal and view the
          privacy policy.
        </p>
        <ButtonBase variant="primary" onClick={() => setIsOpen(true)}>
          Open Privacy Policy
        </ButtonBase>
      </div>
      <PrivacyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <ModalWithTrigger />,
};

// Story showing the modal open by default
export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log("Modal closed"),
  },
};

// Story demonstrating the modal's responsive behavior
export const Responsive: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log("Modal closed"),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

// Story showing modal closed state (for testing)
export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => console.log("Modal closed"),
  },
  render: (args) => (
    <div className="min-h-screen bg-bg p-8 flex items-center justify-center">
      <p className="text-text-muted">Modal is closed (isOpen = false)</p>
      <PrivacyModal {...args} />
    </div>
  ),
};

// Story showing the scrollable content
const ScrollableDemo = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-bg p-8">
      <p className="text-text-muted mb-4 text-center">
        The modal content is scrollable - try scrolling through the Privacy
        Policy
      </p>
      <PrivacyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

export const Scrollable: Story = {
  render: () => <ScrollableDemo />,
};
