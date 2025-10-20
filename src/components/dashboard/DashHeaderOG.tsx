"use client";

import { ButtonBase } from "../general/buttonBase";

export interface DashboardHeaderProps {
  title?: string;
  username?: string;
  onMenuClick?: () => void;
  className?: string;
}

export default function DashboardHeader({
  title = "PLEASE PLEASE PLEASE",
  username = "Convex username here",
  onMenuClick,
  className = "",
}: DashboardHeaderProps) {
  return (
    <div data-element="HEADER" className={`col-span-2 ${className}`}>
      <div className="flex justify-between items-start">
        <div
          data-element="HEADER-TITLES-WRAPPER"
          className="flex flex-col gap-2"
        >
          <p className="text-sm bg-purple text-text-bright w-fit py-1 px-2">
            DASHBOARD
          </p>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="uppercase text-text-muted">{username}</p>
        </div>
        <div
          data-element="HEADER-CONTROLS-WRAPPER"
          className="flex flex-col gap-2"
        >
          <ButtonBase
            variant="default"
            size="sm"
            onClick={onMenuClick}
            className="text-xs"
          >
            SIGN OUT
          </ButtonBase>
        </div>
      </div>
    </div>
  );
}
