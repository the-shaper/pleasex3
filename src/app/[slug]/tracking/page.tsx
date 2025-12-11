"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ConvexDataProvider } from "@/lib/data/convex";
import TicketApprovalCreatorCard from "@/components/checkout/ticketApprovalCreatorCard";
import { ButtonBase } from "@/components/general/buttonBase";
import type { Ticket } from "@/lib/types";

const dataProvider = new ConvexDataProvider();

export default function TrackingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [trackingNumber, setTrackingNumber] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError(null);
    setTicket(null);
    setSearched(true);

    try {
      const result = await dataProvider.getTicketByRef(trackingNumber.trim());
      if (result) {
        setTicket(result);
      } else {
        setError("Ticket not found. Please check your tracking number.");
      }
    } catch (err) {
      console.error("Error fetching ticket:", err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format form data for the card
  const getFormData = (t: Ticket) => ({
    name: t.name || "Anonymous",
    email: t.email || "—",
    taskTitle: t.taskTitle,
    needText: t.message || "No description provided",
    attachments: t.attachments ? t.attachments.join(", ") : "",
    priorityTipCents: t.tipCents || 0,
  });

  return (
    <div className="bg-bg min-h-screen flex flex-col items-center pt-20 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1
            className="text-[40px] font-bold leading-none uppercase"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Track Your Ticket
          </h1>
          <p className="text-text-muted uppercase text-sm">
            Enter your reference number below
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="REF-123456"
              className="w-full p-3 bg-white border border-gray-subtle text-text placeholder:text-text-muted focus:outline-none focus:border-coral uppercase font-mono"
              suppressHydrationWarning
            />
            <ButtonBase
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading || !trackingNumber.trim()}
              className="w-full"
            >
              {loading ? "SEARCHING..." : "TRACK TICKET"}
            </ButtonBase>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-center text-sm uppercase font-medium border border-red-100">
            {error}
          </div>
        )}

        {ticket && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {ticket.status === "open" && (
              <p className="rounded bg-text px-3 py-2 text-sm text-coral">
                {ticket.creatorSlug || "This creator"} hasn't yet reviewed your
                request. We will notify you via e-mail once this has been done.
              </p>
            )}
            <div className="flex justify-center">
              <TicketApprovalCreatorCard
                form={getFormData(ticket)}
                isPriority={ticket.queueKind === "priority"}
                activeQueue={{
                  nextTurn: ticket.queueNumber || "—",
                  activeCount: 0, // We don't have this context here easily, can be omitted or fetched if needed
                }}
                tipDollarsInt={Math.floor((ticket.tipCents || 0) / 100)}
                minPriorityTipCents={0} // Not relevant for display only
                formatEtaMins={() => "—"} // Not relevant
                onChange={() => {}} // Read only
                userName={ticket.name || "User"}
                referenceNumber={ticket.ref}
                approvedContext={ticket.status === "approved"}
                ticketNumber={ticket.queueNumber}
                hideOutOf={true} // Hide "out of X" since we don't have that context
                status={ticket.status}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
