"use client";

import { TagBase } from "@/components/general/tagBase";

interface FormSubmitCardProps {
  form: {
    name: string;
    email: string;
    taskTitle?: string;
    needText: string;
    attachments: string;
    priorityTipCents: number;
  };
  isPriority: boolean;
  referenceNumber: string;
}

export default function FormSubmitCard({
  form,
  isPriority, s
  referenceNumber,
}: FormSubmitCardProps) {
  const queueType = isPriority ? "PRIORITY" : "PERSONAL";
  const queueBadgeBg = isPriority ? "bg-gold" : "bg-greenlite";

  return (
    <section
      className="space-y-1 bg-bg pb-6 max-w-[400px] outline-1 outline-gray-subtle"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Top: Reference number emphasized */}
      <div className="w-full bg-gray-subtle px-4 py-2 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase text-text-muted tracking-wide">
          REFERENCE
        </span>
        <span className="text-xs font-semibold text-text break-all">
          {referenceNumber}
        </span>
      </div>

      {/* Queue badge */}
      <div className={`flex justify-center ${queueBadgeBg}`}>
        <h3 className="text-medium px-3 py-0.5 uppercase">{queueType}</h3>
      </div>

      <div className="space-y-1 px-9">
        {/* Label */}
        <div className="flex gap-2 items-stretch">
          <div className="w-full pt-4">
            <div className="flex justify-left">
              <span className="text-lg text-text-muted">This Ticket:</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 text-text space-y-3">
          <div className="flex flex-col gap-x-6 gap-y-1">
            <div className="text-coral">NAME</div>
            <div className="font-semibold min-w-0 break-words whitespace-pre-wrap mb-2">
              {form.name || "—"}
            </div>

            <div className="text-coral">E-MAIL</div>
            <div className="font-semibold break-all min-w-0 mb-2">
              {form.email || "—"}
            </div>

            <div className="text-coral">TASK</div>
            <div className="font-mono text-xs min-w-0 break-words whitespace-pre-wrap mb-2">
              {form.taskTitle || form.needText.split("\n")[0] || "—"}
            </div>

            <div className="text-coral">DESCRIPTION</div>
            <div className="font-mono text-xs min-w-0 break-words whitespace-pre-wrap mb-2">
              {form.needText || "—"}
            </div>

            <div className="text-coral">DONATED</div>
            <div className="font-mono text-sm min-w-0 break-words mb-2">
              ${Math.floor((form.priorityTipCents || 0) / 100)}
            </div>
          </div>

          <div className="mt-2">
            <TagBase variant={isPriority ? "priority" : "personal"}>
              {queueType} QUEUE REQUEST RECEIVED
            </TagBase>
          </div>
        </div>
      </div>
    </section>
  );
}
