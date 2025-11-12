"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import TicketApprovalCard from "@/components/checkout/ticketApprovalCreatorCard";
import { ConvexDataProvider } from "@/lib/data/convex";
import type { Ticket } from "@/lib/types";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

const dataProvider = new ConvexDataProvider();

export default function SuccessPage() {
  const params = useParams();
  const slug = params.slug as string;
  const sp = useSearchParams();
  const referenceNumber = sp.get("ref") || "DEMO-123";

  const position = useQuery(api.dashboard.getTicketPositionByRef, {
    creatorSlug: slug,
    ref: referenceNumber,
  });

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [queueSnapshot, setQueueSnapshot] = useState<Record<
    string,
    {
      activeTurn: number | null;
      nextTurn: number;
      etaMins: number | null;
      activeCount: number;
      enabled: boolean;
    }
  > | null>(null);
  const [creatorInfo, setCreatorInfo] = useState<{
    displayName: string;
    minPriorityTipCents: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch ticket, queue data, and creator info in parallel
        const [ticketData, queueData, creatorData] = await Promise.all([
          dataProvider.getTicketByRef(referenceNumber),
          dataProvider.getQueueSnapshot(slug),
          dataProvider.getCreatorInfo?.(slug) ||
            Promise.resolve({ displayName: slug, minPriorityTipCents: 1500 }),
        ]);

        setTicket(ticketData);
        setQueueSnapshot(queueData);
        setCreatorInfo(creatorData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load ticket data");
      } finally {
        setLoading(false);
      }
    };

    if (referenceNumber && slug) {
      fetchData();
    }
  }, [referenceNumber, slug]);

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
          <h1 className="text-2xl font-bold mb-4 text-text">
            Loading ticket...
          </h1>
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
      name: ticket?.name || "Anonymous",
      email: ticket?.email || "user@example.com",
      needText: ticket?.message || "No description provided",
      attachments: ticket?.attachments ? ticket.attachments.join(", ") : "",
      priorityTipCents: ticket?.tipCents || 0,
    },
    isPriority: ticket?.queueKind === "priority",
    activeQueue: {
      // If approved and engine has assigned numbers, show the real queueNumber.
      // Otherwise leave as 1 (informational only for open tickets).
      nextTurn:
        (position && position.status === "approved"
          ? position.queueNumber || position.ticketNumber || 1
          : 1),
      activeCount:
        queueSnapshot?.[ticket?.queueKind as "personal" | "priority"]
          ?.activeCount || 0,
    },
    tipDollarsInt: Math.floor((ticket?.tipCents || 0) / 100),
    minPriorityTipCents: creatorInfo?.minPriorityTipCents || 1500,
    queueMetrics: {
      personal: { etaMins: queueSnapshot?.personal?.etaMins || 240 },
      priority: { etaMins: queueSnapshot?.priority?.etaMins || 60 },
    },
    userName: creatorInfo?.displayName || slug,
    referenceNumber:
      (position && position.ticketNumber
        ? `#${position.ticketNumber}`
        : ticket?.ref || referenceNumber),
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
