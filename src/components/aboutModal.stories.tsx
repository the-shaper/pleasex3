import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { AboutModal } from "./aboutModal";
import { ButtonBase } from "./general/buttonBase";

const meta: Meta<typeof AboutModal> = {
    title: "Components/General/AboutModal",
    component: AboutModal,
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

type Story = StoryObj<typeof AboutModal>;

// Interactive story that allows opening and closing the modal
const ModalWithTrigger = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="min-h-screen bg-bg p-8">
            <div className="max-w-2xl mx-auto space-y-4">
                <h1 className="text-4xl font-bold text-text mb-4">About Modal Demo</h1>
                <p className="text-text-muted mb-8">
                    Click the button below to open the modal and test the tab switching
                    functionality.
                </p>
                <ButtonBase variant="primary" onClick={() => setIsOpen(true)}>
                    Open About Modal
                </ButtonBase>
            </div>
            <AboutModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
    );
};

export const Interactive: Story = {
    render: () => <ModalWithTrigger />,
};

// Story showing the modal in "WHAT" tab
export const WhatTab: Story = {
    args: {
        isOpen: true,
        onClose: () => console.log("Modal closed"),
    },
};

// Story showing the modal with both tabs
const BothTabsDemo = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="min-h-screen bg-bg p-8">
            <p className="text-text-muted mb-4 text-center">
                Try switching between the tabs to see different content
            </p>
            <AboutModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
    );
};

export const BothTabs: Story = {
    render: () => <BothTabsDemo />,
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
            <AboutModal {...args} />
        </div>
    ),
};
