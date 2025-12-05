import { ReactNode, useState } from "react";
import { SidebarSection } from "./sidebarSection";
import { SidebarLink } from "./sidebarLink";
import type { SideBarProps } from "@/lib/types";

// Extend for local use (types.ts already extended, but ensure)
interface ExtendedSideBarProps extends SideBarProps {
  isOpen?: boolean;
  onClose?: () => void;
  mobileOverlay?: boolean;
  topContent?: ReactNode;
}

export function SideBar({
  sections,
  initialActiveLink = "/",
  currentTab,
  isOpen = false,
  onClose,
  mobileOverlay = false,
  topContent,
}: ExtendedSideBarProps) {
  const [activeLink, setActiveLink] = useState<string>(initialActiveLink);

  // Base classes for desktop/normal use
  const baseClasses = "flex flex-col w-full gap-2";

  // Mobile overlay classes: apply fixed/slide only on mobile, static on desktop
  const mobileClasses = mobileOverlay
    ? `fixed md:static left-0 top-0 h-screen md:h-auto w-64 md:w-full overflow-y-auto bg-bg/90 backdrop-blur-xs md:bg-transparent shadow-lg md:shadow-none z-50 md:z-auto transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full hidden"} md:block flex flex-col gap-2`
    : "hidden md:flex flex-col w-full gap-2";

  const classes = mobileOverlay
    ? mobileClasses
    : `${baseClasses} hidden md:flex`;

  const handleLinkClick = (href: string) => {
    setActiveLink(href);
    onClose?.(); // Auto-close on link click for mobile
  };

  return (
    <div className={classes}>
      {mobileOverlay && onClose && (
        <button
          onClick={onClose}
          className="mt-3 right-4 p-2 text-coral hover:text-gray-700 focus:outline-none md:hidden hidden"
          aria-label="Close menu"
        >
          TAP TO CLOSE
        </button>
      )}
      {topContent}
      {sections.map((section, sectionIndex) => (
        <SidebarSection key={sectionIndex} title={section.title}>
          {section.links.map((link, linkIndex) => (
            <SidebarLink
              key={linkIndex}
              href={link.href}
              label={link.label}
              isActive={
                currentTab
                  ? link.href.includes(currentTab)
                  : activeLink === link.href
              }
              onClick={() => handleLinkClick(link.href)}
            />
          ))}
        </SidebarSection>
      ))}
    </div>
  );
}
