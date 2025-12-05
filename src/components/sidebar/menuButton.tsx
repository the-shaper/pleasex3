import React from "react";

interface MenuButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export function MenuButton({ onClick, isOpen = false }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 text-gray-700 hover:text-gray-900 focus:outline-none bg-greenlite"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
        />
      </svg>
    </button>
  );
}
