import { useState } from "react";
import { SidebarSection } from "./sidebarSection";
import { SidebarLink } from "./sidebarLink";
import type { SideBarProps } from "@/lib/types";

export function SideBar({
  sections,
  initialActiveLink = "/",
  currentTab,
}: SideBarProps) {
  const [activeLink, setActiveLink] = useState<string>(initialActiveLink);
  return (
    <div className="w-full flex flex-col gap-2">
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
              onClick={() => setActiveLink(link.href)}
            />
          ))}
        </SidebarSection>
      ))}
    </div>
  );
}
