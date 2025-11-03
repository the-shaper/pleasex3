"use client";

import { TagBase } from "@/components/general/tagBase";
import { ButtonBase } from "@/components/general/buttonBase";

interface TicketApprovalCreatorCardProps {
  form: {
    name: string;
    email: string;
    taskTitle?: string; // New: Optional short title (from Convex/parent)
    needText: string; // Existing: Long description
    attachments: string;
    priorityTipCents: number;
  };
  isPriority: boolean;
  activeQueue?: {
    nextTurn: number | string;
    activeCount: number;
  };
  tipDollarsInt: number;
  minPriorityTipCents: number;
  queueMetrics?: {
    priority?: { etaMins: number };
    personal?: { etaMins: number };
  };
  formatEtaMins: (mins: number) => string;
  onChange: (field: string, value: any) => void;
  userName: string;
  referenceNumber: string;
  approvedContext?: boolean;
  approveHandler?: () => void; // Passed from parent (e.g., ApprovalPanel's handleApprove)
  rejectHandler?: () => void; // Passed from parent (e.g., ApprovalPanel's handleReject)
  isLoading?: boolean; // From parent's actionLoading
}

export default function TicketApprovalCreatorCard({
  form,
  isPriority,
  activeQueue,
  tipDollarsInt,
  minPriorityTipCents,
  queueMetrics,
  formatEtaMins,
  onChange,
  userName,
  referenceNumber,
  approvedContext = false,
  approveHandler,
  rejectHandler,
  isLoading = false,
}: TicketApprovalCreatorCardProps) {
  // Remove all internal handler and loading state logic

  const queueBadgeBg = isPriority ? "bg-gold" : "bg-greenlite";
  const statusVariant = approvedContext ? "approved" : "pending"; // Assume variants exist or style accordingly
  const etaMins =
    queueMetrics?.[isPriority ? "priority" : "personal"]?.etaMins || 0;
  const etaText = formatEtaMins(etaMins);
  const queueType = isPriority ? "PRIORITY" : "PERSONAL";
  const activeCount = activeQueue?.activeCount ?? 0;
  const nextTurn = activeQueue?.nextTurn ?? "—";

  return (
    <section
      className="space-y-1 bg-bg pb-6 max-w-[400px] outline-1 outline-gray-subtle"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Top Badge: Queue Type */}
      <div className={`flex justify-center ${queueBadgeBg}`}>
        <h3 className="text-medium px-3 py-0.5 uppercase">{queueType}</h3>
      </div>

      <div className="space-y-1 px-9">
        {/* Header Section */}
        <div className="flex gap-2 items-stretch">
          <div className="w-full pt-4">
            <div className="flex justify-left">
              <span className="text-lg text-text-muted">This Ticket:</span>
            </div>
          </div>
        </div>

        {/* Queue Information Block */}
        <div className="flex flex-wrap items-end gap-6 pt-5">
          <span className="text-[111px] leading-[77px] text-coral font-mono text-height-tight">
            {nextTurn}
          </span>
          <div className="text-[11px] uppercase text-text text-left max-w-[44%] flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="bg-gray-subtle px-3 flex items-center gap-2">
                <p>out of</p>
                <p className="text-text-muted text-xl">{activeCount}</p>
              </div>
            </div>
            <TagBase variant={isPriority ? "priority" : "personal"}>
              {queueType}
            </TagBase>
            <div className="flex items-center gap-1">
              <p className="bg-gray-subtle px-3 py-0.5">STATUS</p>
              <TagBase variant={statusVariant}>
                {approvedContext ? "APPROVED" : "PENDING"}
              </TagBase>
            </div>
          </div>
        </div>

        {/* Name & Contact Section */}
        <div className="px-3 pt-6 text-text">
          <div className="flex flex-col gap-1">
            <div className="text-coral">NAME</div>
            <div className="font-semibold min-w-0 break-words whitespace-pre-wrap">
              {form.name || "—"}
            </div>
            <div className="text-coral">E-MAIL</div>
            <div className="font-semibold break-all min-w-0">
              {form.email || "—"}
            </div>
          </div>
        </div>

        {/* Expandable Details Section (Always Visible) */}
        <div className="p-3 text-text space-y-3">
          <div className="flex flex-col gap-x-6 gap-y-1">
            <div className="text-coral">TASK</div>
            <div className="font-mono text-xs min-w-0 break-words whitespace-pre-wrap mb-2">
              {form.taskTitle || form.needText.split("\n")[0] || "—"}
            </div>

            {/* Existing: Long Description - Renamed label, kept needText (no duplicate) */}
            <div className="text-coral">DESCRIPTION</div>
            <div className="font-mono text-xs min-w-0 break-words whitespace-pre-wrap mb-2">
              {form.needText || "—"}
            </div>

            <div className="text-coral">DONATED</div>
            <div className="font-mono text-sm min-w-0 break-words mb-2">
              ${tipDollarsInt || 0}
            </div>
            <div className="text-coral">REFERENCE</div>
            <div className="font-mono text-sm min-w-0 break-words mb-2">
              {referenceNumber || "—"}
            </div>
          </div>

          {/* Action Buttons for Pending Tickets */}
          {!approvedContext && approveHandler && rejectHandler && (
            <div className="flex gap-2 mt-4">
              <ButtonBase
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={approveHandler}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Approve"}
              </ButtonBase>
              <ButtonBase
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={rejectHandler}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Reject"}
              </ButtonBase>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
