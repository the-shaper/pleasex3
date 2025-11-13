"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FormSubmitCard from "@/components/checkout/formSubmitCard";
import { ConvexDataProvider } from "@/lib/data/convex";
import type { Ticket } from "@/lib/types";

const dataProvider = new ConvexDataProvider();

export default function FormSubmittedPage() {
  const params = useParams();
  const slug = params.slug as string;
  const sp = useSearchParams();
  const referenceNumber = sp.get("ref") || "";

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!referenceNumber) {
        setLoading(false);
        setError("Missing ticket reference.");
        return;
      }

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

    fetchData();
  }, [referenceNumber]);

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
          <h1 className="text-2xl font-bold mb-4 text-text">Ticket submitted</h1>
          <p className="text-text-muted">
            {error ||
              "Your form was submitted. If you saved your reference number, you can check back later."}
          </p>
        </div>
      </div>
    );
  }

  const form = {
    name: ticket.name || "Anonymous",
    email: ticket.email || "user@example.com",
    taskTitle: ticket.taskTitle,
    needText: ticket.message || "No description provided",
    attachments: ticket.attachments ? ticket.attachments.join(", ") : "",
    priorityTipCents: ticket.tipCents || 0,
  };

  const isPriority = ticket.queueKind === "priority";

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-center mb-1 text-text uppercase">
          Ticket Submission Successful!
        </h1>
        <p className="mt-2 text-center text-xs text-text-muted max-w-md">
          This confirms we received your request. Keep your reference number to
          track this ticket or share it if needed. The creator will review and,
          if approved, it will be assigned an official queue number.
        </p>
        <h2 className="text-center mb-2 text-coral uppercase">
          Save this reference number
        </h2>
        <FormSubmitCard
          form={form}
          isPriority={isPriority}
          referenceNumber={ticket.ref}
        />
      </div>
    </div>
  );
}
