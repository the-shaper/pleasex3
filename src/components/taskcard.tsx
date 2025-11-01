"use client";

import { useState } from "react";
import { ButtonBase } from "./general/buttonBase";
import { TagBase } from "./general/tagBase";
import { TaskTag } from "@/lib/types";

export type TaskCardVariant = "autoqueue" | "priority" | "personal";

/**
 * TaskCard variants:
 * - "autoqueue": Shows the current ticket being worked on (first approved ticket).
 *                Expanded by default, represents the creator's current focus task.
 * - "priority": Individual priority queue ticket
 * - "personal": Individual personal queue ticket
 */

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
  tags?: TaskTag[];
  createdAt: number;
  ref: string;
}

export interface TaskCardProps {
  /**
   * The visual style and behavior of the task card
   */
  variant: TaskCardVariant;
  /**
   * The ticket data to display. For autoqueue variant, this should be
   * the first approved ticket's data (current task being worked on).
   */
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
      : isAutoqueue
        ? "bg-coral"
        : "bg-gray-subtle";
  const queueBadgeBg = isPriority
    ? "bg-gold"
    : isPersonal
      ? "bg-greenlite"
      : isAutoqueue
        ? "bg-coral"
        : "bg-gray-subtle";
  const queueTypeVariant = isPriority
    ? "priority"
    : isPersonal
      ? "personal"
      : isAutoqueue
        ? "autoqueue"
        : "neutral";

  // Toggle expanded state
  const toggleExpanded = () => {
    if (!isAutoqueue) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <section
      className={`space-y-1 ${className} bg-bg pb-6 max-w-[400px] outline-1 outline-gray-subtle`}
    >
      {/* Queue Type Badge */}
      <div className={`flex justify-center ${queueBadgeBg}`}>
        <h3 className="text-medium  px-3 py-0.5">{variant.toUpperCase()}</h3>
      </div>
      <div className="space-y-1 px-9">
        {/* Header Section */}
        <div className="flex gap-2 items-stretch">
          {/* Main Content Area */}
          <div className={`w-full pt-4`}>
            {/* Top Row with Status Badge */}
            <div className="flex justify-left">
              <span
                className="text-lg text-text-muted "
                style={{ fontFamily: "var(--font-body)" }}
              >
                This Ticket:
              </span>
            </div>

            {/* Queue Information */}
            <div className="flex flex-wrap items-end gap-6 pt-5">
              <span className="text-[111px] leading-[77px] text-coral font-mono text-height-tight">
                {data.nextTurn}
              </span>
              <div
                className=" text-[11px] uppercase text-text text-left max-w-[44%] flex flex-col gap-1"
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
                  {(() => {
                    // Priority order for displaying single status tag
                    const priorityOrder = [
                      "current",
                      "next-up",
                      "attn",
                      "awaiting-feedback",
                      "finished",
                      "pending",
                    ];
                    const highestPriorityTag = data.tags?.find((tag) =>
                      priorityOrder.includes(tag)
                    )
                      ? data.tags.find((tag) => priorityOrder.includes(tag))
                      : data.tags?.[0]; // fallback to first tag if none match priority

                    return highestPriorityTag ? (
                      <TagBase variant={highestPriorityTag}>
                        {highestPriorityTag.replace("-", " ").toUpperCase()}
                      </TagBase>
                    ) : (
                      <TagBase variant="neutral">PENDING</TagBase>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Name & Contact Section - Always Visible */}
        <div className="px-3 pt-6 text-text">
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
            <div className="flex flex-col gap-x-6 gap-y-1">
              <div className="text-coral">TASK</div>
              <div className="font-mono text-xs min-w-0 break-words whitespace-pre-wrap mb-2">
                {data.needText || "—"}
              </div>
              <div className="text-coral">LINKS</div>
              <div className="text-xs space-y-1 min-w-0 break-words mb-2">
                {data.attachments.length > 0
                  ? data.attachments.map((url, i) => (
                      <div key={i} className="truncate" title={url}>
                        {url}
                      </div>
                    ))
                  : "—"}
              </div>
              <div className="text-coral">REFERENCE</div>
              <div className="font-mono text-sm min-w-0 break-words mb-2">
                {data.ref}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <ButtonBase variant="primary" size="sm" className="flex-1">
                OPEN TASK
              </ButtonBase>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button (not for autoqueue) */}
        {!isAutoqueue && (
          <div className="flex justify-center p-2">
            <ButtonBase
              variant="secondary"
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
