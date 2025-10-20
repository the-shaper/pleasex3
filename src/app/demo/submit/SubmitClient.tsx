"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CheckoutDonation from "@/components/checkout/checkoutDonation";

type QueuePayload = {
  creator: { slug: string; displayName: string; minPriorityTipCents: number };
  personal: {
    activeTurn: number | null;
    nextTurn: number;
    etaMins: number | null;
    activeCount: number;
    enabled: boolean;
  };
  priority: {
    activeTurn: number | null;
    nextTurn: number;
    etaMins: number | null;
    activeCount: number;
    enabled: boolean;
  };
  general: {
    activeTurn: number | null;
    nextTurn: number;
    etaMins: number | null;
    activeCount: number;
    enabled: boolean;
  };
};

export default function SubmitClient({
  slug,
  initialQueue,
}: {
  slug: string;
  initialQueue: QueuePayload | null;
}) {
  const sp = useSearchParams();
  const router = useRouter();

  function formatEtaMins(etaMins: number | null | undefined): string {
    if (!etaMins || etaMins <= 0) return "—";
    if (etaMins < 60) return "<1h";
    const hours = Math.round(etaMins / 60);
    return `${hours}h`;
  }
  function formatEtaDate(etaMins: number | null | undefined): string {
    if (!etaMins || etaMins <= 0) return "—";
    const ms = etaMins * 60 * 1000;
    const d = new Date(Date.now() + ms);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}.${dd}.${yy}`;
  }

  const initialQueueTab = (
    sp.get("queue") === "priority" ? "priority" : "personal"
  ) as "personal" | "priority";
  const initialTip = (() => {
    const v = sp.get("tipCents");
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();

  const [queue, setQueue] = useState<"personal" | "priority">(initialQueueTab);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    social: "",
    needText: "",
    attachments: "",
    priorityTipCents: initialTip,
    consentEmail: false,
  });
  const [minPriorityTipCents] = useState(
    initialQueue?.creator?.minPriorityTipCents || 0
  );
  const [lastPersonalTipCents, setLastPersonalTipCents] = useState(
    initialQueueTab === "personal" ? initialTip : 0
  );
  const [queueMetrics, setQueueMetrics] = useState<any>(initialQueue);
  const tipDollarsInt = useMemo(
    () => Math.round(form.priorityTipCents / 100),
    [form.priorityTipCents]
  );

  // Auto-switch queue based on tip threshold in both directions
  useEffect(() => {
    if (minPriorityTipCents <= 0) return;
    if (form.priorityTipCents >= minPriorityTipCents && queue !== "priority") {
      setQueue("priority");
    } else if (
      form.priorityTipCents < minPriorityTipCents &&
      queue !== "personal"
    ) {
      setQueue("personal");
    }
  }, [form.priorityTipCents, minPriorityTipCents, queue]);

  // Remember the last personal tip when on personal tab
  useEffect(() => {
    if (queue === "personal") {
      setLastPersonalTipCents(form.priorityTipCents);
    }
  }, [queue, form.priorityTipCents]);

  function onChange<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (queue === "priority" && form.priorityTipCents < minPriorityTipCents) {
      alert(
        `Minimum tip for priority is $${(minPriorityTipCents / 100).toFixed(2)}`
      );
      return;
    }
    const attachments = form.attachments
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creatorSlug: slug,
        queue,
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        location: form.location || undefined,
        social: form.social || undefined,
        needText: form.needText,
        attachments,
        priorityTipCents: form.priorityTipCents,
        consentEmail: form.consentEmail,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      router.push(`/demo/submit/success?ref=${encodeURIComponent(json.ref)}`);
    } else {
      alert(`Error: ${JSON.stringify(json.error)}`);
    }
  }

  const isPriority = queue === "priority";
  const activeQueue = isPriority
    ? queueMetrics?.priority
    : queueMetrics?.personal;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="md:sticky md:top-6 space-y-4">
          <h1
            className="text-[32px] font-bold leading-none"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Claim a ticket
          </h1>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded ${
                queue === "personal" ? "bg-greenlite text-text" : "bg-slate-200"
              }`}
              onClick={() => {
                // Restore last personal tip and switch tab
                if (form.priorityTipCents !== lastPersonalTipCents) {
                  onChange("priorityTipCents", lastPersonalTipCents);
                }
                setQueue("personal");
              }}
            >
              Personal
            </button>
            <button
              className={`px-3 py-1 rounded ${
                queue === "priority" ? "bg-gold text-text" : "bg-slate-200"
              }`}
              onClick={() => {
                const adjusted = Math.max(
                  form.priorityTipCents,
                  minPriorityTipCents
                );
                if (adjusted !== form.priorityTipCents) {
                  onChange("priorityTipCents", adjusted);
                }
                setQueue("priority");
              }}
            >
              Priority
            </button>
          </div>
          <form id="ticket-form" onSubmit={onSubmit} className="space-y-3">
            <input
              className="w-full border p-2 rounded"
              placeholder="Name"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
            <input
              className="w-full border p-2 rounded"
              placeholder="Email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
            <input
              className="w-full border p-2 rounded"
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
            />
            <input
              className="w-full border p-2 rounded"
              placeholder="Location (optional)"
              value={form.location}
              onChange={(e) => onChange("location", e.target.value)}
            />
            <input
              className="w-full border p-2 rounded"
              placeholder="Social (optional)"
              value={form.social}
              onChange={(e) => onChange("social", e.target.value)}
            />
            <textarea
              className="w-full border p-2 rounded"
              placeholder="Describe your need"
              rows={5}
              value={form.needText}
              onChange={(e) => onChange("needText", e.target.value)}
            />
            <textarea
              className="w-full border p-2 rounded"
              placeholder="Links to files (space-separated)"
              rows={2}
              value={form.attachments}
              onChange={(e) => onChange("attachments", e.target.value)}
            />
            {queue === "personal" && (
              <p className="text-xs mt-2 opacity-70">
                If you need this ASAP, try the Priority queue instead.
              </p>
            )}
          </form>
        </div>

        <aside className="space-y-2 pt-3 pb-66">
          <div
            className={`${
              isPriority ? "bg-gold" : "bg-greenlite"
            } box-border content-stretch flex flex-row items-center justify-center px-[13px] py-2 w-full text-center uppercase`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            <span className="text-[15.98px] tracking-[-0.3196px] text-text font-bold">
              TICKET
            </span>
          </div>
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
                THE ESTIMATED DELIVERY TIME PER{" "}
                {isPriority ? "PRIORITY" : "PERSONAL"} TICKET IS{" "}
                {formatEtaMins(
                  queueMetrics?.[isPriority ? "priority" : "personal"]
                    ?.etaMins || 0
                )}
              </div>
            </div>
            <CheckoutDonation
              isPriority={isPriority}
              tipDollarsInt={tipDollarsInt}
              minPriorityTipCents={minPriorityTipCents}
              priorityTipCents={form.priorityTipCents}
              onChangeTip={(cents) => onChange("priorityTipCents", cents)}
            />
            <label className="flex px-6 py-3 items-center gap-2 text-sm justify-center">
              <input
                type="checkbox"
                checked={form.consentEmail}
                onChange={(e) => onChange("consentEmail", e.target.checked)}
              />
              By submitting, you allow the creator to email you occasionally.
            </label>
          </div>

          <button
            form="ticket-form"
            type="submit"
            className={`${
              isPriority ? "bg-coral" : "bg-blue"
            } text-text uppercase text-[24px] px-3 py-3.5 w-full flex items-center justify-between`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            <span>CLAIM TICKET {activeQueue?.nextTurn ?? ""}</span>
            <span>&gt;</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
