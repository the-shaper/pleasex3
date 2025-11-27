"use client";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

function formatEtaDays(etaDays: number | null | undefined): string {
  if (!etaDays || etaDays <= 0) return "—";
  if (etaDays < 1) return "<1 day";
  if (etaDays === 1) return "1 day";
  return `${etaDays} days`;
}

function formatEtaDate(etaDays: number | null | undefined): string {
  if (!etaDays || etaDays <= 0) return "—";
  const ms = etaDays * 24 * 60 * 60 * 1000;
  const d = new Date(Date.now() + ms);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}.${dd}.${yy}`;
}

export type QueueKind = "personal" | "priority";

export interface QueueCardProps {
  kind: QueueKind;
  slug: string;
  data: {
    currentTicketNumber?: number;
    nextTicketNumber?: number;
    etaDays: number | null;
    avgDaysPerTicket?: number;
    enabled: boolean;
  };
  minPriorityTipCents: number;
  nextTicketNumber?: number;
}

export default function QueueCard({
  kind,
  slug,
  data,
  minPriorityTipCents,
  nextTicketNumber,
}: QueueCardProps) {
  const isPriority = kind === "priority";
  const accentBg = isPriority ? "bg-gold" : "bg-greenlite";
  const tipBanner = isPriority
    ? "CHOOSE TIPPING AMOUNT"
    : "WOULD YOU LIKE TO TIP ME?";
  const tipLeftBg = isPriority ? "bg-gold" : "bg-greenlite";
  const tipFieldBg = "#412c2c";
  const tipTextClass = isPriority ? "text-gold" : "text-greenlite";

  const [amountDollars, setAmountDollars] = useState<string>(
    isPriority ? (minPriorityTipCents / 100).toFixed(2) : "0.00"
  );

  // Update local state if the prop changes (e.g. data loaded)
  useEffect(() => {
    if (isPriority) {
      setAmountDollars((minPriorityTipCents / 100).toFixed(2));
    }
  }, [minPriorityTipCents, isPriority]);

  const tipCents = useMemo(() => {
    const dollars = parseFloat((amountDollars || "0").replace(/,/g, "."));
    if (Number.isNaN(dollars)) return 0;
    return Math.max(0, Math.round(dollars * 100));
  }, [amountDollars]);

  const claimHref = useMemo(() => {
    const base = `/${slug}/submit?queue=${kind}`;
    if (isPriority || tipCents > 0) {
      return `${base}&tipCents=${tipCents}`;
    }
    return base;
  }, [slug, kind, tipCents, isPriority]);

  const claimDisabled =
    isPriority && data.enabled && tipCents < minPriorityTipCents;

  return (
    <section className="space-y-2 w-full">
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row gap-2 items-stretch">
          <div
            className="md:w-32 w-full grid gap-1 items-stretch"
            style={{ gridTemplateRows: "auto auto 1fr", minHeight: 167 }}
          >
            <div
              className={`${accentBg} box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-[13px] py-1 w-full text-center uppercase`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              <span className="text-[15.98px] tracking-[-0.3196px] text-text font-bold">
                {isPriority ? "PRIORITY" : "PERSONAL"}
              </span>
            </div>
            <div
              className="bg-[#412c2c] box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-[30px] py-2.5 w-full text-center"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <span className="text-[14.386px] tracking-[-0.2877px] text-coral leading-4  ">
                Current Turn
              </span>
            </div>
            <div className="bg-[#412c2c] box-border content-stretch flex flex-row gap-2.5 items-center justify-center min-w-px px-[37px] py-2.5 w-full">
              <span className="text-[55px] text-coral font-mono">
                {data.currentTicketNumber ?? "—"}
              </span>
            </div>
          </div>
          <div
            className={`${accentBg} flex-1 self-stretch relative pl-3 py-3 pr-6 min-h-[200px]`}
          >
            <div className="flex justify-between items-start">
              <span
                className="text-[11px] tracking-[0.1em] text-coral"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {isPriority
                  ? `$${(minPriorityTipCents / 100).toFixed(0)} USD`
                  : "GRATIS"}
              </span>
              <span
                className="text-[22px]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Next Available
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[111px] leading-none text-coral font-mono">
                {nextTicketNumber ?? data.nextTicketNumber ?? "—"}
              </span>
              <div
                className="flex-1 ml-[-6px] mr-2 text-[11px] uppercase text-text text-left max-w-[44%]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <p>
                  {isPriority
                    ? "PRIORITY QUEUE PRIORITIZES WORK AND BUSINESS-RELATED FAVORS"
                    : "PERSONAL QUEUE PRIORITIZES PERSONAL FAVORS"}
                </p>
                <p className="text-coral underline">"READ WHY"</p>
              </div>
              <span
                className="text-[22px]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                &gt;
              </span>
            </div>
            <div
              className="flex gap-6 mt-2 text-[10px] text-text"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <div>
                <div className="font-bold">Average Time / Favor</div>
                <div>{formatEtaDays(data.avgDaysPerTicket)}</div>
              </div>
              <div>
                <div className="font-bold">Estimated Delivery</div>
                <div>{formatEtaDate(data.etaDays)}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div
            className="bg-[#412c2c] text-[16px] text-bg text-center uppercase py-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {tipBanner}
          </div>
          <div className="flex gap-2">
            <div
              className={`${tipLeftBg} flex-1 py-5 text-center uppercase content-center`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              CHOOSE AMOUNT (USD)
            </div>
            <div
              className="flex-1 py-5 text-center content-center px-5"
              style={{
                backgroundColor: tipFieldBg,
                fontFamily: "var(--font-body)",
              }}
            >
              <div
                className={`inline-flex items-center gap-2 text-[16px] ${tipTextClass}`}
              >
                <button
                  type="button"
                  className="px-2 py-1 border border-gray-subtle"
                  onClick={() =>
                    setAmountDollars((v) =>
                      Math.max(0, parseFloat(v || "0") - 1).toFixed(2)
                    )
                  }
                  aria-label="Decrease tip by one dollar"
                >
                  −
                </button>
                <label className="inline-flex items-center gap-1">
                  <span>$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="1"
                    min={0}
                    className="w-24 bg-transparent outline-none text-inherit text-center no-spinners"
                    value={amountDollars}
                    onChange={(e) => setAmountDollars(e.target.value)}
                    aria-label="Tip amount in dollars"
                  />
                </label>
                <button
                  type="button"
                  className="px-2 py-1 border border-gray-subtle"
                  onClick={() =>
                    setAmountDollars((v) =>
                      (parseFloat(v || "0") + 1).toFixed(2)
                    )
                  }
                  aria-label="Increase tip by one dollar"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          {data.enabled ? (
            <Link
              href={claimHref}
              className={`${isPriority ? "bg-coral" : "bg-blue"} uppercase text-[24px] px-6 py-3.5 w-full flex items-center justify-between ${claimDisabled ? "opacity-60 pointer-events-none" : ""}`}
              aria-label={`Claim a ${kind} ticket`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              <span className=" text-center">
                {isPriority ? "CLAIM PRIORITY TICKET" : "CLAIM PERSONAL TICKET"}
              </span>
              <span>&gt;</span>
            </Link>
          ) : (
            <div className="text-sm text-center  uppercase bg-ielo py-2">This queue is currently closed</div>
          )}
        </div>
      </div>
    </section>
  );
}
