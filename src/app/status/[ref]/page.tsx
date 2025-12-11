"use client";

import { useEffect, useState, use } from "react";
import TicketApprovalCard from "@/components/checkout/ticketApprovalCreatorCard";
import { ConvexDataProvider } from "@/lib/data/convex";
import type { Ticket } from "@/lib/types";

const dataProvider = new ConvexDataProvider();

const formatEtaDays = (etaDays: number | null | undefined): string => {
  if (!etaDays || etaDays <= 0) return "—";
  if (etaDays < 1) return "<1 day";
  if (etaDays === 1) return "1 day";
  return `${etaDays} days`;
};

const formatEtaDate = (etaDays: number | null | undefined): string => {
  if (!etaDays || etaDays <= 0) return "—";
  const ms = etaDays * 24 * 60 * 60 * 1000;
  const d = new Date(Date.now() + ms);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}.${dd}.${yy}`;
};

const formatDottedDate = (ms: number): string => {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}.${dd}.${yy}`;
};

export default function StatusPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = use(params);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [queueData, setQueueData] = useState<{
    etaDays: number | null;
    avgDaysPerTicket?: number;
    activeCount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketData = await dataProvider.getTicketByRef(ref);
        setTicket(ticketData);
      } catch (err) {
        console.error("Error fetching ticket:", err);
        setError("Failed to load ticket data");
      } finally {
        setLoading(false);
      }
    };

    if (ref) {
      fetchTicket();
    }
  }, [ref]);

  useEffect(() => {
    if (!ticket) return;

    let cancelled = false;
    const fetchQueue = async () => {
      try {
        const snapshot = await dataProvider.getQueueSnapshot(
          ticket.creatorSlug
        );
        const queueInfo =
          snapshot?.[ticket.queueKind as "personal" | "priority"];

        if (!cancelled) {
          setQueueData({
            etaDays: queueInfo?.etaDays ?? null,
            avgDaysPerTicket: queueInfo?.avgDaysPerTicket,
            activeCount: queueInfo?.activeCount,
          });
        }
      } catch (queueErr) {
        console.error("Error fetching queue data:", queueErr);
        if (!cancelled) setQueueData(null);
      }
    };

    fetchQueue();
    return () => {
      cancelled = true;
    };
  }, [ticket]);

  const formatEtaMins = (mins: number): string => {
    if (!mins || mins <= 0) return "—";
    if (mins < 60) return "<1h";
    const hours = Math.round(mins / 60);
    return `${hours}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-yellow-600";
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "closed":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Pending Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "closed":
        return "Completed";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1
          className="text-2xl font-bold mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Ticket Status
        </h1>
        <p>Loading ticket information...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1
          className="text-2xl font-bold mb-4 uppercase"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Ticket Status
        </h1>
        <div className="bg-red-50 border border-red-200  p-4">
          <p className="text-red-800">{error || "Ticket not found"}</p>
          <p className="mt-2 text-sm text-red-600">
            Reference: <span className="font-mono">{ref}</span>
          </p>
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

  const isPending = ticket.status === "open";
  const pendingReviewerName = ticket.creatorSlug || "This creator";

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-2 uppercase"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Ticket Status
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            Reference:{" "}
            <span className="font-mono font-semibold">{ticket.ref}</span>
          </p>
          <div
            className={`px-3 py-1  text-sm font-medium ${getStatusColor(
              ticket.status
            )} bg-opacity-10`}
          >
            {getStatusText(ticket.status)}
          </div>
        </div>
        {isPending && (
          <p className="mt-3  bg-text px-3 py-2 text-sm text-text-bright uppercase">
            {pendingReviewerName} hasn't yet reviewed your request. We will
            notify you via e-mail once this has been done.
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Submitted: {formatDottedDate(ticket.createdAt)}
        </p>
      </div>

      <div className="p-6 flex flex-col items-center">
        {ticket.status === "approved" && queueData && (
          <div className="bg-text border border-gray-200  p-4 mb-6">
            <h3 className="text-sm font-semibold text-text-bright mb-3 uppercase">
              Estimated Delivery
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-text-bright">
              <div>
                <div className="font-medium text-text-bright ">
                  Average Time / Favor
                </div>
                <div className="font-mono">
                  {formatEtaDays(queueData.avgDaysPerTicket)}
                </div>
              </div>
              <div>
                <div className="font-medium">Estimated Delivery</div>
                <div className="font-mono">
                  {formatEtaDate(queueData.etaDays)}
                </div>
              </div>
              <div>
                <div className="font-medium">Queue Position</div>
                <div className="font-mono">#{ticket.queueNumber || "—"}</div>
              </div>
            </div>
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
    </div>
  );
}
