"use client";

import { useState, forwardRef } from "react";
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
  onOpen?: (data: TaskCardData) => void; // NEW: Callback for opening task in module
}

const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(({
  variant,
  data,
  className = "",
  onOpen,
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(variant === "autoqueue");

  const isPriority = variant === "priority";
  const isPersonal = variant === "personal";
  const isAutoqueue = variant === "autoqueue";

  // Determine colors based on variant
  const queueBadgeBg = isPriority
    ? "bg-gold"
    : isPersonal
      ? "bg-greenlite"
      : isAutoqueue
        ? "bg-text"
        : "bg-text-bright";

  const queueBadgeText = isPriority
    ? "text-text"
    : isPersonal
      ? "text-text"
      : isAutoqueue
        ? "text-white"
        : "text-white";
  // Toggle expanded state
  const toggleExpanded = () => {
    if (!isAutoqueue) {
      setIsExpanded(!isExpanded);
    }
  };

  const queueText = isPersonal
    ? "personal tickets"
    : isPriority
      ? "priority tickets"
      : "total tickets";

  const queueInfoBg = isAutoqueue
    ? "bg-gray-subtle"
    : isPriority
      ? "bg-gold"
      : "bg-greenlite";

  return (
    <section
      ref={ref}
      className={`space-y-1 ${className} bg-bg pb-4 min-w-[300px] md:w-full outline-1 outline-gray-subtle`}
    >
      {/* Queue Type Badge */}
      <div className={`flex justify-center ${queueBadgeBg}`}>
        <h3 className={`text-base ${queueBadgeText}  px-3 py-0.5`}>
          {variant.toUpperCase()}
        </h3>
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
                  <div
                    className={`${queueInfoBg} px-3 flex items-center gap-2`}
                  >
                    <p className="leading-none text-[0.6rem] md:-mr-2 ">
                      out of
                    </p>
                    <p className="text-text-muted text-xl">
                      {data.activeCount}
                    </p>
                    <p className="leading-none text-[0.6rem]">{queueText}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <p className="bg-gray-subtle px-3 py-0.5 text-[10px]">
                    {" "}
                    STATUS{" "}
                  </p>
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
            <div className="text-coral md:block hidden">E-MAIL</div>
            <div className="font-semibold break-all min-w-0 md:block hidden">
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
            <div className="flex gap-2 mt-4 md:hidden">
              <ButtonBase
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => onOpen?.(data)}
              >
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
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
