"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import QueueCard from "../../../ui-backup/QueueCard";

export default function CreatorQueuesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const minPriorityTipCents = 1500;
  // Reactive queries (auto-update on DB changes)
  const queueSnapshot = useQuery(api.queues.getSnapshot, { creatorSlug: slug });
  const creatorInfo =
    useQuery(api.dashboard.getCreator, { creatorSlug: slug }) ||
    ({ displayName: slug } as any);
  const nextNumbers = useQuery(api.dashboard.getNextTicketNumbers, {
    creatorSlug: slug,
  });

  if (!queueSnapshot) {  // Loading (useQuery handles)
    return (
      <div className="bg-bg">
        <div className="max-w-6xl mx-auto p-8 min-h-screen flex flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Loading queue information...
            </h1>
            <p className="text-gray-600">
              Please wait while we fetch the latest queue status.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure etaDays is number | null, not undefined
  const safeQueueSnapshot = {
    personal: { ...queueSnapshot.personal, etaDays: queueSnapshot.personal.etaDays ?? null },
    priority: { ...queueSnapshot.priority, etaDays: queueSnapshot.priority.etaDays ?? null },
    general: { ...queueSnapshot.general, etaDays: queueSnapshot.general.etaDays ?? null },
  };

  return (
    <div className="bg-bg">
      <div className="max-w-6xl mx-auto p-8 min-h-screen flex flex-col">
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <p
              className="uppercase text-text-muted"
              style={{ fontFamily: "var(--font-body)" }}
            >
              NEED A QUICK FAVOR FROM{" "}
              <span className="text-coral">{creatorInfo.displayName}?</span>
            </p>
            <h1
              className="text-[40px] font-bold leading-none"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Please Please Please
            </h1>
            <p
              className="uppercase text-coral"
              style={{ fontFamily: "var(--font-body)" }}
            >
              JOIN THE QUEUE
            </p>
          </div>
          <Link
            href={`/${slug}/tracking`}
            className="bg-blue-2 px-6 py-1 uppercase"
            style={{ fontFamily: "var(--font-body)" }}
          >
            I HAVE A TRACKING NUMBER
          </Link>
        </header>
        <main className="flex-1 flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full items-stretch content-stretch">
            <QueueCard
              kind="personal"
              slug={slug}
              data={safeQueueSnapshot.personal}
              nextTicketNumber={nextNumbers?.nextPersonalNumber}
              minPriorityTipCents={minPriorityTipCents}
            />
            <QueueCard
              kind="priority"
              slug={slug}
              data={safeQueueSnapshot.priority}
              nextTicketNumber={nextNumbers?.nextPriorityNumber}
              minPriorityTipCents={minPriorityTipCents}
            />
          </div>
        </main>
        <footer className="py-6">
          <div className="flex items-center justify-between">
            <div
              className="bg-greenlite px-6 py-1 uppercase"
              style={{ fontFamily: "var(--font-body)" }}
            >
              I WANT TO DO FAVORS TOO
            </div>
            <div
              className="bg-blue-2 px-6 py-1 uppercase text-xs"
              style={{ fontFamily: "var(--font-body)" }}
            >
              please please please! is shareware provided by twilight fringe
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
