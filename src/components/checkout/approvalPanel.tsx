"use client";

import { useState } from "react";
import TicketApprovalCard from "./ticketApprovalCard";
import { ConvexDataProvider } from "@/lib/data/convex";
import type { Ticket } from "@/lib/types";

const dataProvider = new ConvexDataProvider();

interface ApprovalPanelProps {
  tickets: Ticket[];
  onTicketUpdate?: (ticket: Ticket) => void;
}

export default function ApprovalPanel({
  tickets,
  onTicketUpdate,
}: ApprovalPanelProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const formatEtaMins = (mins: number): string => {
    if (!mins || mins <= 0) return "—";
    if (mins < 60) return "<1h";
    const hours = Math.round(mins / 60);
    return `${hours}h`;
  };

  const handleApprove = async (ticket: Ticket) => {
    setActionLoading(ticket.ref);
    try {
      await fetch(`/api/tickets/${ticket.ref}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Refresh ticket data
      const updatedTicket = await dataProvider.getTicketByRef(ticket.ref);
      if (onTicketUpdate && updatedTicket) {
        onTicketUpdate(updatedTicket);
      }
    } catch (err) {
      console.error("Error approving ticket:", err);
      alert("Failed to approve ticket");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (ticket: Ticket) => {
    setActionLoading(ticket.ref);
    try {
      await fetch(`/api/tickets/${ticket.ref}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Refresh ticket data
      const updatedTicket = await dataProvider.getTicketByRef(ticket.ref);
      if (onTicketUpdate && updatedTicket) {
        onTicketUpdate(updatedTicket);
      }
    } catch (err) {
      console.error("Error rejecting ticket:", err);
      alert("Failed to reject ticket");
    } finally {
      setActionLoading(null);
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-xl font-bold mb-4">PENDING APPROVALS</h2>
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
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">PENDING APPROVALS</h2>
      <div className="flex-1 overflow-y-auto space-y-6">
        {tickets.map((ticket) => {
          // Map ticket data to the format expected by TicketApprovalCard
          const ticketData = {
            form: {
              name: ticket.name || "Anonymous",
              email: ticket.email || "user@example.com",
              needText: ticket.message || "No description provided",
              attachments: ticket.attachments
                ? ticket.attachments.join(", ")
                : "",
              priorityTipCents: ticket.tipCents,
            },
            isPriority: ticket.queueKind === "priority",
            activeQueue: {
              nextTurn: 1, // Could be calculated from queue position
              activeCount: 1, // Could be calculated from queue metrics
            },
            tipDollarsInt: Math.floor(ticket.tipCents / 100),
            minPriorityTipCents: 1500, // Should come from creator data
            queueMetrics: {
              personal: { etaMins: 90 },
              priority: { etaMins: 45 },
            },
            userName: "Alejandro", // Should come from creator data
            referenceNumber: ticket.ref,
          };

          return (
            <div key={ticket.ref} className="bg-white rounded-lg border p-4">
              {/* Status indicator */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">Ticket Status</h3>
                    <p className="text-xs text-gray-600">
                      Reference: {ticket.ref} • Submitted:{" "}
                      {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ticket.status === "open"
                        ? "bg-yellow-100 text-yellow-800"
                        : ticket.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : ticket.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Action buttons for open tickets */}
              {ticket.status === "open" && (
                <div className="mb-4 flex gap-3 justify-center">
                  <button
                    onClick={() => handleApprove(ticket)}
                    disabled={actionLoading === ticket.ref}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === ticket.ref
                      ? "Processing..."
                      : "✅ Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(ticket)}
                    disabled={actionLoading === ticket.ref}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === ticket.ref
                      ? "Processing..."
                      : "❌ Reject"}
                  </button>
                </div>
              )}

              <TicketApprovalCard
                form={ticketData.form}
                isPriority={ticketData.isPriority}
                activeQueue={ticketData.activeQueue}
                tipDollarsInt={ticketData.tipDollarsInt}
                minPriorityTipCents={ticketData.minPriorityTipCents}
                queueMetrics={ticketData.queueMetrics}
                formatEtaMins={formatEtaMins}
                onChange={() => {}}
                userName={ticketData.userName}
                referenceNumber={ticketData.referenceNumber}
                approvedContext={ticket.status === "approved"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
