"use client";

import { ReactNode } from "react";

type GeneralNumberVariant = "default" | "active";

export interface GeneralNumberProps {
  data: {
    activeTurn: number;
  };
  variant?: GeneralNumberVariant;
  className?: string;
}

const getVariantClasses = (variant: GeneralNumberVariant): string => {
  switch (variant) {
    case "active":
      return "text-coral";
    case "default":
    default:
      return "text-text-muted";
  }
};

export const GeneralNumber: React.FC<GeneralNumberProps> = ({
  data,
  variant = "default",
  className = "",
}) => {
  return (
    <div className={className}>
      <span
        className={`text-xl leading-none font-mono ${getVariantClasses(
          variant
        )}`}
      >
        {data.activeTurn}
      </span>
    </div>
  );
};
