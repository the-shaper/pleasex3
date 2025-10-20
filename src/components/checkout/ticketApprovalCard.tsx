"use client";

import FinalDonation from "./finalDonation";

interface TicketApprovalCardProps {
  form: {
    name: string;
    email: string;
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
}

export default function TicketApprovalCard({
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
}: TicketApprovalCardProps) {
  return (
    <div
      className="bg-bg p-4 text-text border border-gray-subtle space-y-3"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="grid grid-cols-[120px_1fr] gap-x-6 gap-y-2 p-3 min-w-0">
        <div className="text-coral">NAME</div>
        <div className="font-semibold min-w-0 break-words whitespace-pre-wrap">
          {form.name || "—"}
        </div>
        <div className="text-coral">E-MAIL</div>
        <div className="font-semibold break-all min-w-0">
          {form.email || "—"}
        </div>
        <div className="text-coral">TASK</div>
        <div className="font-mono text-sm min-w-0 break-words whitespace-pre-wrap">
          {form.needText || "—"}
        </div>
        <div className="text-coral">LINKS</div>
        <div className="text-sm space-y-1 min-w-0 break-words">
          {form.attachments.trim()
            ? form.attachments.split(/\s+/).map((u, i) => (
                <div key={i} className="truncate" title={u}>
                  {u}
                </div>
              ))
            : "—"}
        </div>
      </div>
      <div
        className={`${
          isPriority ? "bg-gold" : "bg-greenlite"
        } pt-4 pb-4 px-9 border border-gray-subtle text-text text-center flex flex-col items-center`}
      >
        <div
          className="text-[18px]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          YOUR TICKET NUMBER
        </div>
        <div className="mt-1 text-[96px] leading-none text-coral font-mono">
          {activeQueue?.nextTurn ?? "—"}
        </div>
        <div className="mt-3 text-[12px]">
          THERE ARE {activeQueue?.activeCount ?? 0} TICKETS BEFORE YOU,
          <br />
          THE ESTIMATED DELIVERY TIME PER {isPriority
            ? "PRIORITY"
            : "PERSONAL"}{" "}
          TICKET IS{" "}
          {formatEtaMins(
            queueMetrics?.[isPriority ? "priority" : "personal"]?.etaMins || 0
          )}
        </div>
      </div>
      <FinalDonation
        isPriority={isPriority}
        tipDollarsInt={tipDollarsInt}
        minPriorityTipCents={minPriorityTipCents}
      />

      <div
        className={`flex flex-col items-center justify-center text-center py-4 px-22 ${
          approvedContext ? "bg-coral text-white" : "bg-greenlite"
        }`}
      >
        <h1 className="font-bold text-2xl">
          {approvedContext ? "GOOD NEWS!" : "THANK YOU!"}
        </h1>
        <p className="font-bold uppercase mb-2">
          {approvedContext
            ? `Ticket ${activeQueue?.nextTurn ?? "—"} is now yours`
            : `Ticket ${activeQueue?.nextTurn ?? "—"} is almost yours`}
        </p>
        {!approvedContext && (
          <p className="leading-none">
            {userName} has received your application and will be in touch soon
          </p>
        )}
      </div>

      <div className="flex flex-col items-center text-center justify-center bg-blue py-3 px-22">
        <h1 className="font-bold text-2xl leading-none">{referenceNumber}</h1>
        <p>
          THIS IS YOUR REFERENCE NUMBER. You will receive an email with your
          ticket details
        </p>
      </div>
    </div>
  );
}
