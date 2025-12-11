"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarLinkProps = {
  href: string;
  label: string;
  isActive?: boolean; // Optional prop for testing/storybook
  onClick?: () => void; // Optional click handler
};

export function SidebarLink({
  href,
  label,
  isActive,
  onClick,
}: SidebarLinkProps) {
  const pathname = usePathname();
  const computedIsActive =
    isActive !== undefined ? isActive : pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-6 py-2 uppercase text-xs w-full text-left tracking-wider ${
        computedIsActive
          ? "bg-coral text-text-bright "
          : "bg-gray-subtle hover:bg-blue-2"
      }`}
    >
      {label}
    </Link>
  );
}
