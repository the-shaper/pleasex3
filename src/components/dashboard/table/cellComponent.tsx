"use client";

import { GeneralNumber } from "./generalNumber";
import { TagBase } from "../../general/tagBase";
import { ButtonBase } from "../../general/buttonBase";

export interface CellComponentData {
  // General number - combined position across all queues
  generalNumber: number;
  // Ticket number - position in specific queue (priority or personal)
  ticketNumber: number;
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
}

export interface CellComponentProps {
  data: CellComponentData;
  onOpen?: (ref: string) => void;
  className?: string;
  currentTurn?: number;
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
  currentTurn,
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

  return (
    // UPDATED: Make entire row clickable; remove button column
    <div
      className={`grid gap-4 items-center p-2 border-b border-gray-subtle cursor-pointer hover:bg-gray-subtle/50 transition-colors ${className} ${
        isClickable ? "focus:bg-gray-subtle" : ""
      }`}
      style={{
        gridTemplateColumns: "100px 100px 100px 1fr 1fr 140px", // REMOVED: 120px for button column
      }}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleOpen : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      aria-disabled={!isClickable}
      aria-label={isClickable ? `Open ticket ${data.ref}` : undefined}
    >
      {/* General Number */}
      <div className="flex justify-center">
        <GeneralNumber
          data={{ activeTurn: data.generalNumber }}
          variant={data.generalNumber === currentTurn ? "active" : "default"}
        />
      </div>

      {/* Ticket Number */}
      <div className="flex justify-center">
        <TagBase variant={data.queueKind}>{data.ticketNumber}</TagBase>
      </div>

      {/* Queue Type */}
      <div className="flex justify-center">
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

      {/* Request Date */}
      <div className="text-sm text-text-muted font-mono">
        {formatDate(data.requestDate)}
      </div>

      {/* REMOVED: Open Button - Now handled by row click */}
    </div>
  );
}
