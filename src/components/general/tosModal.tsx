"use client";

import { LegalModal } from "./legalModal";
import { TOS_CONTENT } from "@/lib/tosContent";

export interface TosModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  title?: string;
}

export function TosModal({
  isOpen,
  onClose,
  className = "",
  title = "Terms of Service",
}: TosModalProps) {
  return (
    <LegalModal
      isOpen={isOpen}
      onClose={onClose}
      className={className}
      title={title}
      content={TOS_CONTENT}
      contactEmail="uncreate@twilightfringe.com"
      contactSubject="uncreate me"
      contactButtonText="REQUEST DATA DELETION"
    />
  );
}
