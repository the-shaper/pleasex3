"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import TicketApprovalCard from "@/components/checkout/ticketApprovalCard";
import { ConvexDataProvider } from "@/lib/data/convex";
import type { Ticket } from "@/lib/types";

const dataProvider = new ConvexDataProvider();

export default function SuccessPage() {
  const sp = useSearchParams();
  const referenceNumber = sp.get("ref") || "DEMO-123";

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketData = await dataProvider.getTicketByRef(referenceNumber);
        setTicket(ticketData);
      } catch (err) {
        console.error("Error fetching ticket:", err);
        setError("Failed to load ticket data");
      } finally {
        setLoading(false);
      }
    };

    if (referenceNumber) {
      fetchTicket();
    }
  }, [referenceNumber]);

  const formatEtaMins = (mins: number): string => {
    if (!mins || mins <= 0) return "—";
    if (mins < 60) return "<1h";
    const hours = Math.round(mins / 60);
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4 text-text">Loading ticket...</h1>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-bg py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4 text-text">Error</h1>
          <p className="text-text-muted">{error || "Ticket not found"}</p>
        </div>
      </div>
    );
  }

  // Map ticket data to the format expected by TicketApprovalCard
  const ticketData = {
    form: {
      name: "Anonymous", // Not stored in ticket yet
      email: "user@example.com", // Not stored in ticket yet
      needText: ticket.message || "No description provided",
      attachments: "", // Not implemented yet
      priorityTipCents: ticket.tipCents,
    },
    isPriority: ticket.queueKind === "priority",
    activeQueue: {
      nextTurn: 1, // Mock for now
      activeCount: 1, // Mock for now
    },
    tipDollarsInt: Math.floor(ticket.tipCents / 100),
    minPriorityTipCents: 1500, // Mock for now
    queueMetrics: {
      personal: { etaMins: 240 },
      priority: { etaMins: 60 },
    },
    userName: "Demo Creator", // Mock for now
    referenceNumber: ticket.ref,
  };

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-1 text-text uppercase">
          Ticket Submission Successful!
        </h1>
        <h2 className="text-center mb-8 text-coral uppercase">
          You can close this page now
        </h2>
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
        />
      </div>
    </div>
  );
}
