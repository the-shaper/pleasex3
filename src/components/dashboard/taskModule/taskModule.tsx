"use client";

import type { TaskCardData } from "../../taskcard";
import { ButtonBase } from "../../general/buttonBase";
import { TagBase } from "../../general/tagBase";
import { useMemo, useEffect } from "react";
import { TaskTag } from "@/lib/types";
import { useState } from "react"; // Ensure useState is imported
// removed unused import
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export interface TaskModuleProps {
  data: TaskCardData;
  /** Optional explicit title for the ticket (separate from description). */
  title?: string;
  className?: string;
  onSendForFeedback?: () => void;
  onMarkAsFinished?: () => void;
  isModal?: boolean; // NEW: If true, hide collapse chevron (for modal use)
}

function formatRequestedOn(createdAt: number | undefined): string {
  if (!createdAt) return "—";
  const d = new Date(createdAt);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function formatUsdFromCents(cents: number | undefined): string {
  if (!cents || cents <= 0) return "$0.00 USD";
  return `$${(cents / 100).toFixed(2)} USD`;
}

export default function TaskModule({
  data,
  className = "",
  onSendForFeedback,
  onMarkAsFinished,
  isModal,
}: TaskModuleProps) {
  // Live ticket subscription for reactive status
  const liveTicket = useQuery(api.tickets.getByRef, { ref: data.ref });

  // Calculate statusTag before early return to follow React Rules of Hooks
  const statusTag = useMemo(() => {
    if (!data) return "pending";

    // Priority order mirrors TaskCard
    const priorityOrder = [
      "current",
      "next-up",
      "attn",
      "awaiting-feedback",
      "finished",
      "pending",
    ] as const;

    const tagsSource = (liveTicket?.tags as TaskTag[] | undefined) ?? data.tags;
    const chosen = tagsSource?.find((t) =>
      priorityOrder.includes(t as TaskTag)
    );
    return chosen ?? (data.status as TaskTag) ?? "pending";
  }, [data, liveTicket?.tags]);

  const [isCollapsed, setIsCollapsed] = useState(false); // NEW: Collapse state, default expanded

  // Local status for immediate UI feedback, synced with derived statusTag
  const [localStatus, setLocalStatus] = useState(statusTag as TaskTag);
  useEffect(() => {
    setLocalStatus(statusTag as TaskTag);
  }, [statusTag]);

  // Convex mutation to toggle between current <-> awaiting-feedback with exclusivity
  const toggleCurrentAwaiting = useMutation(api.tickets.toggleCurrentAwaiting);
  const [isToggling, setIsToggling] = useState(false);

  const canToggle =
    localStatus === "current" || localStatus === "awaiting-feedback";
  const isAwaiting = localStatus === "awaiting-feedback";
  const isCurrent = localStatus === "current";

  const handleStatusButtonClick = async () => {
    if (!canToggle || isToggling) return;
    setIsToggling(true);
    try {
      const res = await toggleCurrentAwaiting({ ref: data.ref });
      if (
        res &&
        res.ok &&
        (res.tag === "current" || res.tag === "awaiting-feedback")
      ) {
        setLocalStatus(res.tag);
        // Optional: also call upstream handler if provided
        if (onSendForFeedback) onSendForFeedback();
      }
    } catch (e) {
      console.error("Failed to toggle status for", data.ref, e);
    } finally {
      setIsToggling(false);
    }
  };

  // Show placeholder when no data is available THIS IS A PLACEHOLDER! EDIT BELOW IT
  if (!data) {
    return (
      <section className={`flex flex-col gap-6 text-text  ${className}`}>
        <h2 className="text-xl tracking-tight font-mono font-bold pb-4 ">
          DETAILED VIEW :
        </h2>
        <div className="flex items-center justify-center h-64 bg-gray-subtle/20 rounded-lg border-2 border-dashed border-gray-subtle">
          <div className="text-center">
            <p className="text-text-muted mb-2">No current task</p>
            <p className="text-sm text-text-muted">
              Approved tickets will appear here
            </p>
          </div>
        </div>
      </section>
    );
  }

  const firstLink = data.attachments?.[0];

  const toggleCollapse = () => setIsCollapsed(!isCollapsed); // NEW: Toggle function

  return (
    <section className={`flex flex-col gap-6 text-text  ${className}`}>
      {/* UPDATED: Make title clickable with chevron */}
      <button
        onClick={toggleCollapse}
        className="flex items-center justify-between w-full text-left border-b border-gray-subtle"
        aria-expanded={!isCollapsed}
      >
        <h2 className="text-xl tracking-tight font-mono font-bold pb-2 ">
          TASK DETAILS:
        </h2>
        {!isModal && ( // NEW: Hide chevron in modal
          <span
            className={`text-xs text-gray-subtle transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        )}
      </button>

      {/* NEW: Wrap content for collapse */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? "max-h-0" : "max-h-auto"}`}
      >
        {/* Component Title */}
        {/* Main Content Wrapper */}
        <div className="flex md:flex-row md:gap-8 flex-col gap-4">
          {/* Left Content Wrapper */}
          <div className="flex-1 flex gap-4">
            {/* Scrollable Content */}
            <div className="flex-1 max-h-[60svh] overflow-y-auto pr-2">
              {/* Ticket type wrapper */}
              <div
                className="flex items-center gap-2 text-[11px] uppercase"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="text-text-muted text-[0.6rem]">Queue</span>
                <TagBase
                  variant={
                    data.queueKind === "priority" ? "priority" : "personal"
                  }
                >
                  {data.nextTurn}
                </TagBase>

                <TagBase
                  variant={
                    data.queueKind === "priority" ? "priority" : "personal"
                  }
                >
                  {(data.queueKind ?? "personal").toUpperCase()}
                </TagBase>
                <span className=" bg-gray-subtle px-2 text-[0.6rem] leading-none py-0.5">
                  out of
                </span>
                <span className="text-coral text-sm">{data.activeCount}</span>
                <span className=" bg-gray-subtle px-2 text-[0.6rem] leading-none py-0.5">
                  {data.queueKind === "priority"
                    ? "priority tickets"
                    : "personal tickets"}
                </span>
              </div>

              {/* Ticket name (task title) and status wrapper */}
              <div className="mt-4 flex items-center gap-3">
                <h3 className="text-2xl font-mono break-words min-w-0">
                  {data.needText || "—"}
                </h3>
                <TagBase variant={localStatus as TaskTag}>
                  {String(localStatus).replace("-", " ").toUpperCase()}
                </TagBase>
              </div>

              {/* Description wrapper */}
              <div className="mt-6">
                <div className="text-coral">DESCRIPTION</div>
                <p className="mt-2 font-mono text-sm whitespace-pre-wrap break-words">
                  {data.needText || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Content Wrapper */}
          <aside className="w-full md:max-w-[320px] flex flex-col gap-6 md:pl-6 md:pb-1 md:border-l border-t md:border-t-0 border-gray-subtle ">
            <div
              className="space-y-3 text-sm"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-text-muted">REQUESTED ON</span>
                <span className="bg-gray-subtle px-2 py-0.5">
                  {formatRequestedOn(data.createdAt)}
                </span>
              </div>

              <div>
                <div className="text-coral">BY:</div>
                <div className="font-semibold break-words">
                  {data.name || "—"}
                </div>
              </div>

              <div>
                <div className="text-coral">E-MAIL</div>
                <div className="font-semibold break-all">
                  {data.email || "—"}
                </div>
              </div>

              <div>
                <div className="text-coral">CONTENT LINK</div>
                {firstLink ? (
                  <a
                    href={firstLink}
                    target="_blank"
                    rel="noreferrer"
                    className="underline break-all"
                  >
                    {firstLink}
                  </a>
                ) : (
                  <div>—</div>
                )}
              </div>

              <div>
                <div className="text-coral">DONATED</div>
                <div className="font-mono">
                  {formatUsdFromCents(data.tipCents)}
                </div>
              </div>

              <div>
                <div className="text-coral">REFERENCE</div>
                <div className="font-mono">{data.ref}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <ButtonBase
                variant={isAwaiting ? "primary" : "primary"}
                size="sm"
                className={`flex-1 ${isAwaiting ? "bg-purple text-text hover:bg-purple" : ""}`}
                onClick={handleStatusButtonClick}
                disabled={!canToggle || isToggling}
                loading={isToggling}
              >
                {String(localStatus).replace("-", " ").toUpperCase()}
              </ButtonBase>
              <ButtonBase
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={onMarkAsFinished}
              >
                FINISHED{" "}
              </ButtonBase>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
