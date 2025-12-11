"use client";

import { GeneralNumber } from "./generalNumber";
import { TagBase } from "../../general/tagBase";

import { getGridColumns } from "./tableLayout";

export interface CellComponentData {
  // General number - combined position across all queues
  generalNumber: number | null;
  // Ticket number - position in specific queue (priority or personal)
  ticketNumber: number | null;
  // Queue type
  queueKind: "personal" | "priority";
  // Task description
  task: string;
  // Submitter's name
  submitterName: string;
  // Request date (timestamp)
  requestDate: number;
  // Ticket reference for open action
  ref: string;
  // Status for styling
  status: "open" | "approved" | "rejected" | "closed";
  // Tip amount in cents
  tipCents?: number;
  // Tags from convex tickets table
  tags?: string[];
  // Resolved timestamp (optional)
  resolvedAt?: number;
}

export interface CellComponentProps {
  data: CellComponentData;
  onOpen?: (ref: string) => void;
  className?: string;
  isActive?: boolean; // NEW: Highlight when active from ScrollTrigger
  disableFocusStyling?: boolean; // NEW: Disable focus styling for dashboard context
  variant?: "active" | "past" | "all"; // NEW: Table variant for conditional columns
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function CellComponent({
  data,
  onOpen,
  className = "",
  isActive,
  disableFocusStyling = false,
  variant = "active",
}: CellComponentProps) {
  const handleOpen = () => {
    onOpen?.(data.ref);
  };

  // NEW: Keyboard handler for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpen();
    }
  };

  // UPDATED: Conditionally enable row clicks based on status
  const isClickable = data.status === "open" || data.status === "approved";

  // Format tip as dollars
  const formatTip = (cents?: number) => {
    if (!cents) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    // UPDATED: Make entire row clickable; remove button column
    <div
      className={`grid gap-4 items-start px-4 py-2 border-b border-gray-subtle cursor-pointer hover:bg-blue-2 transition-colors whitespace-nowrap ${className} ${
        isClickable ? "focus:bg-gray-subtle" : ""
      } ${
        isActive ? "bg-gray-subtle" : "" // NEW: Highlight when active from ScrollTrigger
      }`}
      style={{
        gridTemplateColumns: getGridColumns(variant),
      }}
      role={
        disableFocusStyling ? undefined : isClickable ? "button" : undefined
      }
      tabIndex={disableFocusStyling ? undefined : isClickable ? 0 : undefined}
      onClick={isClickable ? handleOpen : undefined}
      onKeyDown={
        disableFocusStyling
          ? undefined
          : isClickable
            ? handleKeyDown
            : undefined
      }
      aria-disabled={!isClickable}
      aria-label={isClickable ? `Open ticket ${data.ref}` : undefined}
    >
      {/* General Number */}
      <div className="flex justify-start">
        {data.generalNumber != null ? (
          <GeneralNumber
            data={{ activeTurn: data.generalNumber }}
            variant={isActive ? "active" : "default"}
          />
        ) : (
          <span className="text-sm text-text-muted">—</span>
        )}
      </div>

      {/* Ticket Number */}
      <div className="flex justify-start">
        {data.ticketNumber != null ? (
          <TagBase variant={data.queueKind}>{data.ticketNumber}</TagBase>
        ) : (
          <TagBase variant={data.queueKind}>—</TagBase>
        )}
      </div>

      {/* Queue Type */}
      <div className="flex justify-start">
        <TagBase variant={data.queueKind}>
          {data.queueKind.toUpperCase()}
        </TagBase>
      </div>

      {/* Task */}
      <div className="truncate max-w-xs text-sm" title={data.task}>
        {data.task || "—"}
      </div>

      {/* Submitter's Name */}
      <div className="truncate max-w-xs text-sm" title={data.submitterName}>
        {data.submitterName || "—"}
      </div>

      {/* CONDITIONAL: Tags - Only for past/all variants */}
      {(variant === "past" || variant === "all") && (
        <div
          className="truncate max-w-xs text-sm"
          title={data.tags?.join(", ")}
        >
          {data.tags && data.tags.length > 0 ? data.tags[0] : "—"}
        </div>
      )}

      {/* CONDITIONAL: Status - Only for past/all variants */}
      {(variant === "past" || variant === "all") && (
        <div className="text-sm text-text-muted">{data.status || "—"}</div>
      )}

      {/* CONDITIONAL: Tip - Only for past/all variants */}
      {(variant === "past" || variant === "all") && (
        <div className="text-sm text-text-muted font-mono">
          {formatTip(data.tipCents)}
        </div>
      )}

      {/* Request Date */}
      <div className="text-sm text-text-muted font-mono">
        {formatDate(data.requestDate)}
      </div>

      {/* CONDITIONAL: Resolved Date - Only for past/all variants */}
      {(variant === "past" || variant === "all") && (
        <div className="text-sm text-text-muted font-mono">
          {data.resolvedAt ? formatDate(data.resolvedAt) : "—"}
        </div>
      )}

      {/* REMOVED: Open Button - Now handled by row click */}
    </div>
  );
}
