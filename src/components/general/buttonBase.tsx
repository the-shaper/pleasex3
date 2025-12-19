"use client";

import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "default" | "primary" | "secondary" | "ghost" | "outline" | "neutral" | "hover-custom" | "tertiary";
type ButtonSize = "sm" | "default" | "lg";

// Base props shared by both button and link variants
interface BaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
}

// Props when used as a button
interface ButtonProps extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> {
  href?: never;
}

// Props when used as a link
interface LinkProps extends BaseProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> {
  href: string;
  disabled?: boolean;
}

export type ButtonBaseProps = ButtonProps | LinkProps;

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
    case "neutral":
      return "bg-gray-subtle hover:bg-gray-200";
    case "hover-custom":
      return "bg-gray-subtle text-text";
    case "tertiary":
      return "bg-blue-2 text-text hover:opacity-90";
    default:
      return "bg-gray-subtle ";
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

  const tertiaryClasses = variant === "tertiary" ? "rounded-none focus-visible:ring-0" : "";
  const combinedClasses =
    `${baseClasses} ${variantClasses} ${sizeClasses} ${tertiaryClasses} ${className}`.trim();

  const loadingSpinner = loading && (
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
  );

  // Render as link if href is provided
  if ("href" in props && props.href) {
    const { href, ...anchorProps } = props;
    return (
      <a
        href={href}
        className={combinedClasses}
        aria-disabled={disabled || loading}
        onClick={(e) => {
          if (disabled || loading) {
            e.preventDefault();
          }
          anchorProps.onClick?.(e);
        }}
        {...anchorProps}
      >
        {loadingSpinner}
        {children}
      </a>
    );
  }

  // Render as button
  const { href, ...buttonProps } = props as ButtonProps & { href?: never };
  return (
    <button
      className={combinedClasses}
      disabled={disabled || loading}
      {...buttonProps}
    >
      {loadingSpinner}
      {children}
    </button>
  );
}
