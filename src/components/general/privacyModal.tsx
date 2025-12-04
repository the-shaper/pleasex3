"use client";

import { LegalModal } from "./legalModal";
import { PRIVACY_POLICY_CONTENT } from "@/lib/privPolicyContent";

export interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  title?: string;
}

export function PrivacyModal({
  isOpen,
  onClose,
  className = "",
  title = "Privacy Policy",
}: PrivacyModalProps) {
  return (
    <LegalModal
      isOpen={isOpen}
      onClose={onClose}
      className={className}
      title={title}
      content={PRIVACY_POLICY_CONTENT}
      contactEmail="create@twilightfringe.com"
      contactSubject="Privacy Policy Inquiry"
      contactButtonText="CONTACT US"
    />
  );
}
