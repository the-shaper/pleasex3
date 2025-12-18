"use client";

import { TagBase } from "@/components/general/tagBase";
import { ButtonBase } from "@/components/general/buttonBase";

interface TicketApprovalCreatorCardProps {
  form: {
    name: string;
    email: string;
    taskTitle?: string;
    needText: string;
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
  approveHandler?: () => void;
  rejectHandler?: () => void;
  isLoading?: boolean;
  // New optional fields for engine-aligned display
  ticketNumber?: number | string;
  hideOutOf?: boolean;
  status?: string;
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
  ticketNumber,
  hideOutOf = false,
  status,
}: TicketApprovalCreatorCardProps) {
  const queueBadgeBg = isPriority ? "bg-gold" : "bg-greenlite";

  let statusVariant = approvedContext ? "approved" : "pending";
  if (status === "closed") statusVariant = "finished";
  if (status === "rejected") statusVariant = "rejected";

  const etaMins =
    queueMetrics?.[isPriority ? "priority" : "personal"]?.etaMins || 0;
  const etaText = formatEtaMins(etaMins);
  const queueType = isPriority ? "PRIORITY" : "PERSONAL";

  // Prefer explicit engine-provided ticketNumber when present; otherwise fall back
  // to the previous nextTurn value for backwards compatibility.
  const displayedTicketNumber = ticketNumber ?? activeQueue?.nextTurn ?? "—";
  const activeCount = activeQueue?.activeCount ?? 0;

  return (
    <section
      className="space-y-1 bg-bg pb-6 max-w-[400px] outline-1 outline-gray-subtle"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className={`flex justify-center ${queueBadgeBg}`}>
        <h3 className="text-medium px-3 py-0.5 uppercase">{queueType}</h3>
      </div>

      <div className="space-y-1 md:px-9 px-3">
        <div className="flex gap-2 items-stretch">
          <div className="w-full pt-4">
            <div className="flex justify-left">
              <span className="text-lg text-text-muted uppercase">
                This Ticket:
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end md:gap-6 gap-4 md:pt-5 pt-2">
          <span className="md:text-8xl text-6xl leading-[77px] text-coral font-mono text-height-tight">
            {displayedTicketNumber}
          </span>
          <div className="text-[11px] uppercase text-text text-left max-w-[44%] flex flex-col gap-1">
            {!hideOutOf && (
              <div className="flex items-center gap-2">
                <div className="bg-gray-subtle px-3 flex items-center gap-2">
                  <p>out of</p>
                  <p className="text-text-muted text-xl">{activeCount}</p>
                </div>
              </div>
            )}
            <TagBase variant={isPriority ? "priority" : "personal"}>
              {queueType}
            </TagBase>
            <div className="flex items-center gap-1">
              <p className="bg-gray-subtle px-3 py-0.5">STATUS</p>
              <TagBase variant={statusVariant as any}>
                {statusVariant === "finished"
                  ? "FINISHED"
                  : statusVariant === "rejected"
                    ? "REJECTED"
                    : approvedContext
                      ? "APPROVED"
                      : "PENDING"}
              </TagBase>
            </div>
          </div>
        </div>

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

        <div className="p-3 text-text space-y-3">
          <div className="flex flex-col gap-x-6 gap-y-1">
            <div className="text-coral">TASK</div>
            <div className="font-mono text-xs min-w-0 break-words whitespace-pre-wrap mb-2">
              {form.taskTitle || form.needText.split("\n")[0] || "—"}
            </div>

            <div className="text-coral">DESCRIPTION</div>
            <div className="font-mono text-xs min-w-0 break-words whitespace-pre-wrap mb-2">
              {form.needText || "—"}
            </div>

            <div className="text-coral">DONATED</div>
            <div className="font-mono text-sm min-w-0 break-words mb-2">
              ${tipDollarsInt || 0}
            </div>
            <div className="text-coral">LINKS</div>
            <div className="font-mono text-sm min-w-0 break-words mb-2">
              {form.attachments && form.attachments.trim()
                ? form.attachments
                    .split(/\s+/)
                    .map((url: string, idx: number) => (
                      <div key={idx}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text underline break-all"
                        >
                          {url}
                        </a>
                      </div>
                    ))
                : "—"}
            </div>
            <div className="text-coral">REFERENCE</div>
            <div className="font-mono text-sm min-w-0 break-words mb-2">
              {referenceNumber || "—"}
            </div>
          </div>

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
