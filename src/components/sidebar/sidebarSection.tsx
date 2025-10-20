import React, { useState } from "react";

type SidebarSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function SidebarSection({ title, children }: SidebarSectionProps) {
  const [activeLink, setActiveLink] = useState<string | null>(null);
  return (
    <div className="w-full flex flex-col gap-2 items-end">
      <p className="w-full pl-8 py-1 text-xl text-text font-bold uppercase tracking-wider border">
        {title}
      </p>
      <div className="w-5/6 flex flex-col gap-2">{children}</div>
    </div>
  );
}
