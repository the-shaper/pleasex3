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
}: CellComponentProps) {
  const handleOpen = () => {
    onOpen?.(data.ref);
  };

  return (
    <div
      className={`grid gap-4 items-center p-2 border-b border-gray-subtle ${className}`}
      style={{
        gridTemplateColumns: "100px 100px 100px 1fr 1fr 140px 120px",
      }}
    >
      {/* General Number */}
      <div className="flex justify-center">
        <GeneralNumber
          data={{ activeTurn: data.generalNumber }}
          variant={data.status === "open" ? "active" : "default"}
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

      {/* Open Button */}
      <div className="flex justify-center">
        <ButtonBase
          variant="primary"
          size="sm"
          onClick={handleOpen}
          disabled={data.status !== "open"}
        >
          OPEN
        </ButtonBase>
      </div>
    </div>
  );
}
