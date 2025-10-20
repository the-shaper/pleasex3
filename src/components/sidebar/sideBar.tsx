import { useState } from "react";
import { SidebarSection } from "./sidebarSection";
import { SidebarLink } from "./sidebarLink";

const sidebarSections = [
  {
    title: "Favors",
    links: [
      { href: "/", label: "Status" },
      { href: "/active", label: "Active Favors" },
      { href: "/past", label: "Past Favors" },
    ],
  },
  {
    title: "My Page",
    links: [
      { href: "/settings", label: "Favor Settings" },
      { href: "/skills", label: "My Skills" },
    ],
  },
];

export function SideBar() {
  const [activeLink, setActiveLink] = useState<string>("/");
  return (
    <div className="w-full flex flex-col gap-2">
      {sidebarSections.map((section, sectionIndex) => (
        <SidebarSection key={sectionIndex} title={section.title}>
          {section.links.map((link, linkIndex) => (
            <SidebarLink
              key={linkIndex}
              href={link.href}
              label={link.label}
              isActive={activeLink === link.href}
              onClick={() => setActiveLink(link.href)}
            />
          ))}
        </SidebarSection>
      ))}
    </div>
  );
}
