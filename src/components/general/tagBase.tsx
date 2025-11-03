"use client";

import { HTMLAttributes, ReactNode } from "react";

type TagVariant =
  | "attn"
  | "neutral"
  | "priority"
  | "personal"
  | "pending"
  | "next-up"
  | "awaiting-feedback"
  | "finished"
  | "current";

export interface TagBaseProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: TagVariant;
  className?: string;
  fixedWidth?: boolean; // NEW: Optional prop to add fixed min-width (default: false for hug)
}

const getVariantClasses = (variant: TagVariant): string => {
  switch (variant) {
    case "attn":
      return "bg-text text-coral hover:text-text-bright hover:outline hover:outline-1 hover:outline-text";
    case "neutral":
      return "bg-gray-subtle text-text-muted hover:text-text hover:outline hover:outline-1 hover:outline-text";
    case "priority":
      return "bg-gold text-text hover:outline hover:outline-1 hover:outline-text";
    case "personal":
      return "bg-greenlite text-text hover:outline hover:outline-1 hover:outline-text";
    case "pending":
      return "bg-pink text-text hover:outline hover:outline-1 hover:outline-text";
    case "next-up":
      return "bg-ielo text-text hover:outline hover:outline-1 hover:outline-text";
    case "awaiting-feedback":
      return "bg-purple text-text hover:outline hover:outline-1 hover:outline-text";
    case "finished":
      return "bg-blue text-text hover:outline hover:outline-1 hover:outline-text";
    case "current":
      return "bg-coral text-text hover:outline hover:outline-1 hover:outline-text";
    default:
      return "bg-gray-subtle text-text hover:outline hover:outline-1 hover:outline-text";
  }
};

export function TagBase({
  className = "",
  variant = "neutral",
  fixedWidth = false, // NEW: Default to hug (no fixed width)
  children,
  ...props
}: TagBaseProps) {
  // UPDATED: Base classes always hug; add min-w-24 only if fixedWidth
  const baseClasses = `inline-flex items-center justify-center gap-2 text-nowrap font-medium uppercase tracking-wider text-[10px] px-3 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${fixedWidth ? "min-w-24" : ""}`;

  const variantClasses = getVariantClasses(variant);

  const combinedClasses =
    `${baseClasses} ${variantClasses} ${className}`.trim();

  return (
    <span className={combinedClasses} {...props}>
      {children}
    </span>
  );
}
