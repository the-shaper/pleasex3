import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React, { useState } from "react";
import ConfirmDone from "./confirmDone";

const meta: Meta<typeof ConfirmDone> = {
  title: "Components/Dashboard/TaskModule/ConfirmDone",
  component: ConfirmDone,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: {
        inline: true,
        height: "600px",
      },
      description: {
        component: "ConfirmDone component used in taskModule. Displays a modal to confirm the completion of a task.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="relative min-h-[600px] w-full transform scale-100">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: { type: "boolean" },
      description: "Controls whether the modal is open or closed",
    },
    isSubmitting: {
      control: { type: "boolean" },
      description: "Shows loading state on the confirm button",
    },
    onCancel: { action: "cancel" },
    onConfirm: { action: "confirm" },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    isSubmitting: false,
  },
};

export const Submitting: Story = {
  args: {
    isOpen: true,
    isSubmitting: true,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
  },
};

// Interactive story that demonstrates the full flow
const InteractiveConfirmDone = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Open Confirm Dialog
      </button>

      <ConfirmDone
        isOpen={isOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveConfirmDone />,
};

// Story showing different states in a grid layout
const StatesGrid = () => {
  const [submittingStates, setSubmittingStates] = useState([false, false, false]);

  const handleConfirm = (index: number) => {
    const newStates = [...submittingStates];
    newStates[index] = true;
    setSubmittingStates(newStates);

    setTimeout(() => {
      const resetStates = [...submittingStates];
      resetStates[index] = false;
      setSubmittingStates(resetStates);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
      <div>
        <h3 className="text-sm font-medium mb-4">Default State</h3>
        <ConfirmDone
          isOpen={true}
          onCancel={() => { }}
          onConfirm={() => handleConfirm(0)}
          isSubmitting={submittingStates[0]}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Submitting State</h3>
        <ConfirmDone
          isOpen={true}
          onCancel={() => { }}
          onConfirm={() => { }}
          isSubmitting={true}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">With Error State</h3>
        <ConfirmDone
          isOpen={true}
          onCancel={() => { }}
          onConfirm={() => handleConfirm(2)}
          isSubmitting={submittingStates[2]}
        />
      </div>
    </div>
  );
};

export const AllStates: Story = {
  render: () => <StatesGrid />,
};
