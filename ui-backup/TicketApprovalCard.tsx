"use client";
import { useState } from "react";

type Props = {
  ticket: {
    ref: string;
    name: string;
    email: string;
    queue: "personal" | "priority";
    priorityTipCents: number;
    needText: string;
    submittedAt: string | Date;
  };
};

export default function TicketApprovalCard({ ticket }: Props) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function approve() {
    try {
      setLoading("approve");
      setMessage(null);
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticket.ref)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Approve failed`);
      setMessage("Approved");
      // naive refresh
      window.location.reload();
    } catch (err: any) {
      setMessage(err.message || "Error");
    } finally {
      setLoading(null);
    }
  }

  async function reject() {
    try {
      setLoading("reject");
      setMessage(null);
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticket.ref)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Reject failed");
      setMessage("Rejected");
      window.location.reload();
    } catch (err: any) {
      setMessage(err.message || "Error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="border rounded p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-sm">{ticket.ref}</div>
          <div className="text-sm text-gray-500">{ticket.queue.toUpperCase()} • Tip ${ (ticket.priorityTipCents/100).toFixed(2) }</div>
        </div>
        <div className="text-sm text-gray-500">
          {new Date(ticket.submittedAt).toLocaleString()}
        </div>
      </div>
      <div className="mt-2 font-semibold">{ticket.name} <span className="text-gray-500">({ticket.email})</span></div>
      <div className="mt-2 text-sm whitespace-pre-wrap">{ticket.needText}</div>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1 rounded bg-black text-white disabled:opacity-60" onClick={approve} disabled={loading !== null}>
          {loading === "approve" ? "Approving..." : "Approve"}
        </button>
        <button className="px-3 py-1 rounded bg-slate-200 disabled:opacity-60" onClick={reject} disabled={loading !== null}>
          {loading === "reject" ? "Rejecting..." : "Reject"}
        </button>
      </div>
      {message && <div className="mt-2 text-sm text-gray-600">{message}</div>}
    </div>
  );
}


