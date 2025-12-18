"use client";

import { useState } from "react";
import TicketApprovalCreatorCard from "../checkout/ticketApprovalCreatorCard";
import ConfirmReject from "./confirmReject";
import { ConvexDataProvider } from "@/lib/data/convex";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Ticket } from "@/lib/types";
import { QueueSnapshot } from "@/lib/types";

interface ApprovalPanelProps {
  tickets: Ticket[];
  onTicketUpdate?: (ticket: Ticket) => void;
  queueSnapshot: QueueSnapshot;
}

const ApprovalPanelContent = ({
  tickets,
  queueSnapshot,
  onProcessApprove,
  onProcessReject,
}: {
  tickets: Ticket[];
  queueSnapshot: QueueSnapshot;
  onProcessApprove: (ticket: Ticket) => Promise<void>;
  onProcessReject: (ticket: Ticket) => Promise<void>;
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ticketToReject, setTicketToReject] = useState<Ticket | null>(null);

  const formatEtaMins = (mins: number): string => {
    if (!mins || mins <= 0) return "—";
    if (mins < 60) return "<1h";
    const hours = Math.round(mins / 60);
    return `${hours}h`;
  };

  const handleApprove = async (ticket: Ticket) => {
    setActionLoading(ticket.ref);
    try {
      await onProcessApprove(ticket);
    } catch (err: any) {
      console.error("Error approving ticket:", err);
      alert(`Failed to approve ticket: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (ticket: Ticket) => {
    setTicketToReject(ticket);
  };

  const handleConfirmReject = async () => {
    if (!ticketToReject) return;
    setActionLoading(ticketToReject.ref);
    try {
      await onProcessReject(ticketToReject);
      setTicketToReject(null);
    } catch (err: any) {
      console.error("Error rejecting ticket:", err);
      alert(`Failed to reject ticket: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8 text-gray-500">
            <p>No tickets pending approval</p>
            <p className="text-sm mt-2">
              New tickets will appear here for review
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
        {tickets.map((ticket) => {
          const queueKind = ticket.queueKind === "priority" ? "priority" : "personal";
          const queueMetrics = queueSnapshot[queueKind];

          const ticketData = {
            form: {
              name: ticket.name || "Anonymous",
              email: ticket.email || "user@example.com",
              needText: ticket.message || "No description provided",
              taskTitle: ticket.taskTitle || "",
              attachments: ticket.attachments ? ticket.attachments.join(", ") : "",
              priorityTipCents: ticket.tipCents,
            },
            isPriority: ticket.queueKind === "priority",
            activeQueue: {
              nextTurn: queueMetrics.activeCount + 1,
              activeCount: queueMetrics.activeCount,
            },
            tipDollarsInt: Math.floor(ticket.tipCents / 100),
            minPriorityTipCents: 1500,
            queueMetrics: {
              personal: { etaMins: queueSnapshot.personal.etaDays ? queueSnapshot.personal.etaDays * 24 * 60 : 0 },
              priority: { etaMins: queueSnapshot.priority.etaDays ? queueSnapshot.priority.etaDays * 24 * 60 : 0 },
            },
            userName: "Alejandro",
            referenceNumber: ticket.ref,
          };

          const isApprovedOrRejected = ticket.status === "approved" || ticket.status === "rejected";
          const isLoading = actionLoading === ticket.ref;

          return (
            <div key={ticket.ref} className="p-4 bg-coral flex flex-col items-center">
              <div className="mb-4 p-3 bg-text ">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-text-bright uppercase">
                      Ticket Status
                    </h3>
                    <p className="text-xs text-text-bright">
                      Reference: {ticket.ref} • Submitted:{" "}
                      {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <TicketApprovalCreatorCard
                form={ticketData.form}
                isPriority={ticketData.isPriority}
                activeQueue={ticketData.activeQueue}
                tipDollarsInt={ticketData.tipDollarsInt}
                minPriorityTipCents={ticketData.minPriorityTipCents}
                queueMetrics={ticketData.queueMetrics}
                formatEtaMins={formatEtaMins}
                onChange={() => { }}
                userName={ticketData.userName}
                referenceNumber={ticketData.referenceNumber}
                approvedContext={isApprovedOrRejected}
                approveHandler={() => handleApprove(ticket)}
                rejectHandler={() => handleReject(ticket)}
                isLoading={isLoading}
              />
            </div>
          );
        })}
      </div>

      <ConfirmReject
        isOpen={!!ticketToReject}
        onCancel={() => setTicketToReject(null)}
        onConfirm={handleConfirmReject}
        isSubmitting={!!actionLoading}
        ticketRef={ticketToReject?.ref || ""}
      />
    </div>
  );
};

export { ApprovalPanelContent };

export default function ApprovalPanel({
  tickets,
  onTicketUpdate,
  queueSnapshot,
}: ApprovalPanelProps) {
  const capturePayment = useAction(api.payments.capturePaymentForTicket);
  const cancelOrRefund = useAction(api.payments.cancelOrRefundPaymentForTicket);

  // useMemo for dataProvider to avoid module-level instantiation issues in test environments, 
  // though typically it's stateless. Keeping it safe.
  const dataProvider = new ConvexDataProvider();

  const handleProcessApprove = async (ticket: Ticket) => {
    // V3: Capture payment first
    const result = await capturePayment({ ticketRef: ticket.ref });

    if (!result.ok) {
      throw new Error(`Capture failed: ${result.status}`);
    }

    // Refresh ticket data
    const updatedTicket = await dataProvider.getTicketByRef(ticket.ref);
    if (onTicketUpdate && updatedTicket) {
      onTicketUpdate(updatedTicket);
    }
  };

  const handleProcessReject = async (ticket: Ticket) => {
    // V3: Cancel/Refund payment
    const result = await cancelOrRefund({ ticketRef: ticket.ref });

    if (!result.ok) {
      throw new Error(`Rejection failed: ${result.status}`);
    }

    // Refresh ticket data
    const updatedTicket = await dataProvider.getTicketByRef(ticket.ref);
    if (onTicketUpdate && updatedTicket) {
      onTicketUpdate(updatedTicket);
    }
  };

  return (
    <ApprovalPanelContent
      tickets={tickets}
      queueSnapshot={queueSnapshot}
      onProcessApprove={handleProcessApprove}
      onProcessReject={handleProcessReject}
    />
  );
}
