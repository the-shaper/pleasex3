"use client";

import type { TaskCardData } from "../../taskcard";
import { ButtonBase } from "../../general/buttonBase";
import { TagBase } from "../../general/tagBase";
import { useMemo } from "react";
// removed unused import

export interface TaskModuleProps {
  data: TaskCardData;
  /** Optional explicit title for the ticket (separate from description). */
  title?: string;
  className?: string;
  onSendForFeedback?: () => void;
  onMarkAsFinished?: () => void;
}

function formatRequestedOn(createdAt: number | undefined): string {
  if (!createdAt) return "—";
  const d = new Date(createdAt);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function formatUsdFromCents(cents: number | undefined): string {
  if (!cents || cents <= 0) return "$0.00 USD";
  return `$${(cents / 100).toFixed(2)} USD`;
}

export default function TaskModule({
  data,
  title,
  className = "",
  onSendForFeedback,
  onMarkAsFinished,
}: TaskModuleProps) {
  // Early return if no data to prevent null errors
  if (!data) {
    return null;
  }

  const statusTag = useMemo(() => {
    // Priority order mirrors TaskCard
    const priorityOrder = [
      "current",
      "next-up",
      "attn",
      "awaiting-feedback",
      "finished",
      "pending",
    ] as const;

    const chosen = data.tags?.find((t) => priorityOrder.includes(t as any));
    return chosen ?? data.status ?? "pending";
  }, [data.tags, data.status]);

  const firstLink = data.attachments?.[0];

  return (
    <section className={`flex flex-col gap-6 text-text ${className}`}>
      {/* Component Title */}
      <h2 className="text-xl tracking-tight font-mono font-bold ">
        DETAILED VIEW:
      </h2>

      {/* Main Content Wrapper */}
      <div className="flex flex-row gap-8">
        {/* Left Content Wrapper */}
        <div className="flex-1 flex gap-4">
          {/* Scrollable Content */}
          <div className="flex-1 max-h-[60svh] overflow-y-auto pr-2">
            {/* Ticket type wrapper */}
            <div
              className="flex items-center gap-2 text-[11px] uppercase"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <span className="text-text-muted">Queue</span>
              <TagBase
                variant={
                  data.queueKind === "priority" ? "priority" : "personal"
                }
              >
                {data.nextTurn}
              </TagBase>

              <TagBase
                variant={
                  data.queueKind === "priority" ? "priority" : "personal"
                }
              >
                {(data.queueKind ?? "personal").toUpperCase()}
              </TagBase>
              <span className="ml-2 bg-gray-subtle px-2">out of</span>
              <span className="text-text-muted text-sm">
                {data.activeCount}
              </span>
            </div>

            {/* Ticket name (task title) and status wrapper */}
            <div className="mt-4 flex items-center gap-3">
              <h3 className="text-2xl font-mono break-words min-w-0">
                {data.needText || "—"}
              </h3>
              <TagBase variant={statusTag as any}>
                {String(statusTag).replace("-", " ").toUpperCase()}
              </TagBase>
            </div>

            {/* Description wrapper */}
            <div className="mt-6">
              <div className="text-coral">DESCRIPTION</div>
              <p className="mt-2 font-mono text-sm whitespace-pre-wrap break-words">
                {data.needText || "—"}
              </p>
            </div>
          </div>

          {/* Custom Scrollbar placeholder */}
          <div
            aria-hidden
            className="w-[8px] rounded bg-gray-subtle/60 self-stretch"
            title="Custom scrollbar (placeholder)"
          />
        </div>

        {/* Right Content Wrapper */}
        <aside className="w-full max-w-[320px] flex flex-col gap-6 pl-6 ">
          <div
            className="space-y-3 text-sm"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-text-muted">REQUESTED ON</span>
              <span className="bg-gray-subtle px-2 py-0.5">
                {formatRequestedOn(data.createdAt)}
              </span>
            </div>

            <div>
              <div className="text-coral">BY:</div>
              <div className="font-semibold break-words">
                {data.name || "—"}
              </div>
            </div>

            <div>
              <div className="text-coral">E-MAIL</div>
              <div className="font-semibold break-all">{data.email || "—"}</div>
            </div>

            <div>
              <div className="text-coral">CONTENT LINK</div>
              {firstLink ? (
                <a
                  href={firstLink}
                  target="_blank"
                  rel="noreferrer"
                  className="underline break-all"
                >
                  {firstLink}
                </a>
              ) : (
                <div>—</div>
              )}
            </div>

            <div>
              <div className="text-coral">DONATED</div>
              <div className="font-mono">
                {formatUsdFromCents(data.tipCents)}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <ButtonBase
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={onSendForFeedback}
            >
              ONGOING{" "}
            </ButtonBase>
            <ButtonBase
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={onMarkAsFinished}
            >
              FINISHED{" "}
            </ButtonBase>
          </div>
        </aside>
      </div>
    </section>
  );
}
