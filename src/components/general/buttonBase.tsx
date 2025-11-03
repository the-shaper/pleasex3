"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "default" | "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "default" | "lg";

export interface ButtonBaseProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
}

const getVariantClasses = (variant: ButtonVariant): string => {
  switch (variant) {
    case "primary":
      return "bg-coral text-text-bright hover:bg-pink hover:text-text hover:outline-1 hover:font-bold";
    case "secondary":
      return "bg-text text-bg hover:bg-text-muted";
    case "ghost":
      return "hover:bg-gray-subtle text-text";
    case "outline":
      return "border border-gray-subtle bg-transparent hover:bg-gray-subtle text-text";
    default:
      return "bg-gray-subtle text-text hover:bg-coral hover:text-text-bright";
  }
};

const getSizeClasses = (size: ButtonSize): string => {
  switch (size) {
    case "sm":
      return "px-6 h-6 px-3 py-1.5 text-xs";
    case "lg":
      return "px-6 h-8 px-4 py-2 text-sm";
    default:
      return "px-6 h-7 px-3 py-1.5 text-xs";
  }
};

export function ButtonBase({
  className = "",
  variant = "default",
  size = "default",
  children,
  loading = false,
  disabled,
  ...props
}: ButtonBaseProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-nowrap";

  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);

  const combinedClasses =
    `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();

  return (
    <button
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-3 w-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
