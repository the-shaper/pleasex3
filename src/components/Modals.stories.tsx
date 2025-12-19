import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AboutModal } from "./aboutModal";
import { PrivacyModal } from "./general/privacyModal";
import { TosModal } from "./general/tosModal";
import { ReadMeModal } from "./readMeModal";
import { ButtonBase } from "./general/buttonBase";

// Common Meta configuration isn't perfect since they are different components,
// but we can group them in the sidebar under "Components/Modals".
// We'll use a generic meta here and define specific stories.

const meta: Meta = {
  title: "Components/General/All Modals",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "All modals are used in the application. Used for static content.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

// --- Helper Wrapper for Interactivity ---
const ModalWrapper = ({
  Component,
  title,
  label,
}: {
  Component: any;
  title: string;
  label: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="min-h-screen bg-bg p-8 flex flex-col items-center justify-center space-y-4">
      <h1 className="text-2xl font-bold text-text">{title}</h1>
      <ButtonBase variant="primary" onClick={() => setIsOpen(true)}>
        {label}
      </ButtonBase>
      <Component isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

// --- About Modal ---
export const About: StoryObj<typeof AboutModal> = {
  render: () => (
    <ModalWrapper
      Component={AboutModal}
      title="About Modal"
      label="Open About Modal"
    />
  ),
};

// --- Privacy Modal ---
export const Privacy: StoryObj<typeof PrivacyModal> = {
  render: () => (
    <ModalWrapper
      Component={PrivacyModal}
      title="Privacy Policy Modal"
      label="Open Privacy Policy"
    />
  ),
};

// --- Terms of Service Modal ---
export const TermsOfService: StoryObj<typeof TosModal> = {
  render: () => (
    <ModalWrapper
      Component={TosModal}
      title="Terms of Service Modal"
      label="Open ToS"
    />
  ),
};

// --- Read Me Modal ---
export const ReadMe: StoryObj<typeof ReadMeModal> = {
  render: () => (
    <ModalWrapper
      Component={ReadMeModal}
      title="Read Me / Cheatsheet Modal"
      label="Open ReadMe"
    />
  ),
};
