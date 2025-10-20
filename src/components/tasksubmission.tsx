"use client";

import { useState } from "react";
import { ButtonBase } from "./general/buttonBase";
import { TagBase } from "./general/tagBase";

export type TaskCardVariant = "autoqueue" | "priority" | "personal";

export interface TaskCardData {
  // Queue information
  currentTurn: number | null;
  nextTurn: number;
  etaMins: number | null;
  activeCount: number;
  enabled: boolean;

  // Ticket details
  name: string;
  email: string;
  phone?: string;
  location?: string;
  social?: string;
  needText: string;
  attachments: string[];
  tipCents: number;
  queueKind?: "personal" | "priority";
  status: "current" | "next-up" | "pending" | "awaiting-feedback" | "finished";
  createdAt: number;
  ref: string;
}

export interface TaskCardProps {
  variant: TaskCardVariant;
  data: TaskCardData;
  className?: string;
}

function formatEtaMins(etaMins: number | null | undefined): string {
  if (!etaMins || etaMins <= 0) return "—";
  if (etaMins < 60) return "<1h";
  const hours = Math.round(etaMins / 60);
  return `${hours}h`;
}

function formatEtaDate(etaMins: number | null | undefined): string {
  if (!etaMins || etaMins <= 0) return "—";
  const ms = etaMins * 60 * 1000;
  const d = new Date(Date.now() + ms);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}.${dd}.${yy}`;
}

export default function TaskCard({
  variant,
  data,
  className = "",
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(variant === "autoqueue");

  const isPriority = variant === "priority";
  const isPersonal = variant === "personal";
  const isAutoqueue = variant === "autoqueue";

  // Determine colors based on variant
  const accentBg = isPriority
    ? "bg-gold"
    : isPersonal
    ? "bg-greenlite"
    : "bg-gray-subtle";
  const queueTypeVariant = isPriority
    ? "priority"
    : isPersonal
    ? "personal"
    : "neutral";

  // Toggle expanded state
  const toggleExpanded = () => {
    if (!isAutoqueue) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <section className={`space-y-2 ${className} bg-bg`}>
      {/* Queue Type Badge */}
      <div className="flex justify-center bg-gray-subtle">
        <h3 className="text-medium  px-3 py-0.5">{variant.toUpperCase()}</h3>
      </div>
      <div className="space-y-2 px-6">
        {/* Header Section */}
        <div className="flex gap-2 items-stretch">
          {/* Main Content Area */}
          <div
            className={`flex-1 self-stretch relative pl-3 py-3 pr-6 min-h-[200px]`}
          >
            {/* Top Row with Status Badge */}
            <div className="flex justify-left">
              <span
                className="text-[22px]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Current:
              </span>
            </div>

            {/* Queue Information */}
            <div className="flex items-center justify-left mt-1 gap-6">
              <span className="text-[111px] leading-none text-coral font-mono">
                {data.nextTurn}
              </span>
              <div
                className="flex-1 ml-[-6px] mr-2 text-[11px] uppercase text-text text-left max-w-[44%] flex flex-col gap-1"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <div className="flex items-center gap-2 ">
                  <div className="bg-gray-subtle  px-3 flex items-center gap-2">
                    <p>out of</p>
                    <p className="text-text-muted text-xl">
                      {data.activeCount}
                    </p>
                  </div>
                </div>
                <TagBase
                  variant={
                    data.queueKind === "priority" ? "priority" : "personal"
                  }
                >
                  {data.queueKind?.toUpperCase() || "PERSONAL"}
                </TagBase>
                <div className="flex items-center gap-1">
                  <p className="bg-gray-subtle px-3 py-0.5"> STATUS </p>
                  <TagBase variant="pending">
                    {" "}
                    {data.status.toUpperCase()}{" "}
                  </TagBase>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Name & Contact Section - Always Visible */}
        <div className="p-3 text-text">
          <div className="flex flex-col gap-1">
            <div className="text-coral">NAME</div>
            <div className="font-semibold min-w-0 break-words whitespace-pre-wrap">
              {data.name || "—"}
            </div>
            <div className="text-coral">E-MAIL</div>
            <div className="font-semibold break-all min-w-0">
              {data.email || "—"}
            </div>
          </div>
        </div>

        {/* Expandable Details Section */}
        {isExpanded && (
          <div className="p-3 text-text space-y-3">
            <div className="grid grid-cols-[120px_1fr] gap-x-6 gap-y-2">
              {data.phone && (
                <>
                  <div className="text-coral">PHONE</div>
                  <div className="font-semibold break-all min-w-0">
                    {data.phone}
                  </div>
                </>
              )}
              {data.location && (
                <>
                  <div className="text-coral">LOCATION</div>
                  <div className="font-semibold break-all min-w-0">
                    {data.location}
                  </div>
                </>
              )}
              {data.social && (
                <>
                  <div className="text-coral">SOCIAL</div>
                  <div className="font-semibold break-all min-w-0">
                    {data.social}
                  </div>
                </>
              )}
              <div className="text-coral">TASK</div>
              <div className="font-mono text-sm min-w-0 break-words whitespace-pre-wrap">
                {data.needText || "—"}
              </div>
              <div className="text-coral">LINKS</div>
              <div className="text-sm space-y-1 min-w-0 break-words">
                {data.attachments.length > 0
                  ? data.attachments.map((url, i) => (
                      <div key={i} className="truncate" title={url}>
                        {url}
                      </div>
                    ))
                  : "—"}
              </div>
              <div className="text-coral">REFERENCE</div>
              <div className="font-mono text-sm min-w-0 break-words">
                {data.ref}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <ButtonBase variant="primary" size="sm" className="flex-1">
                APPROVE
              </ButtonBase>
              <ButtonBase variant="secondary" size="sm" className="flex-1">
                REJECT
              </ButtonBase>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button (not for autoqueue) */}
        {!isAutoqueue && (
          <div className="flex justify-center p-2">
            <ButtonBase
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="text-xs"
            >
              {isExpanded ? "COLLAPSE" : "EXPAND"} TICKET DETAILS
            </ButtonBase>
          </div>
        )}
      </div>
    </section>
  );
}
