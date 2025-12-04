"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import QueueCard from "../../components/QueueCard";
import { TrackingModal } from "@/components/trackingModal";
import { ButtonBase } from "@/components/general/buttonBase";

export default function CreatorQueuesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Reactive queries (auto-update on DB changes)
  const queueSnapshot = useQuery(api.queues.getSnapshot, { creatorSlug: slug });
  const creatorInfo = useQuery(api.dashboard.getCreator, { creatorSlug: slug });
  const nextNumbers = useQuery(api.dashboard.getNextTicketNumbers, {
    creatorSlug: slug,
  });

  // Loading state
  if (creatorInfo === undefined || queueSnapshot === undefined) {
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

  // 404 if creator doesn't exist
  if (creatorInfo === null) {
    notFound();
  }

  const minPriorityTipCents = creatorInfo.minPriorityTipCents ?? 5000;

  // Ensure etaDays is number | null, not undefined
  const safeQueueSnapshot = {
    personal: { ...queueSnapshot.personal, etaDays: queueSnapshot.personal.etaDays ?? null },
    priority: { ...queueSnapshot.priority, etaDays: queueSnapshot.priority.etaDays ?? null },
    general: { ...queueSnapshot.general, etaDays: queueSnapshot.general.etaDays ?? null },
  };

  return (
    <div className="bg-bg">
      <div className="max-w-6xl mx-auto p-8 min-h-screen flex flex-col">
        <header className="flex md:flex-row flex-col-reverse items-start justify-between md:gap-0 gap-4 pb-4">
          <div className="space-y-0">
            <p
              className="uppercase text-text-muted"
              style={{ fontFamily: "var(--font-body)" }}
            >
              NEED A QUICK FAVOR FROM{" "}
              <span className="text-coral">{creatorInfo.displayName}?</span>
            </p>
            <h1
              className="text-[40px] font-bold leading-none tracking-tighter cursor-pointer"
              style={{ fontFamily: "var(--font-heading)" }}
              onClick={() => router.push(`./`)}
            >
              PLEASE PLEASE PLEASE!
            </h1>
            <p
              className="uppercase text-coral"
              style={{ fontFamily: "var(--font-body)" }}
            >
              JOIN THE QUEUE
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 md:w-1/3 w-full">
            <button
              onClick={() => setIsTrackingModalOpen(true)}
              className="bg-blue-2 px-6 py-1 uppercase cursor-pointer hover:opacity-90 transition-opacity"
              style={{ fontFamily: "var(--font-body)" }}
            >
              I HAVE A TRACKING NUMBER
            </button>
            {isLoaded && user && (
              <ButtonBase
                variant="neutral"
                onClick={() => router.push(`/${slug}/dashboard`)}
                className="hover:bg-purple hover:text-white px-6 py-1 uppercase cursor-pointer hover:opacity-90 transition-opacity"
                style={{ fontFamily: "var(--font-body)" }}
              >
                GO TO DASHBOARD
              </ButtonBase>
            )}
          </div>
        </header>
        <main className="flex-1 flex items-center md:pb-0 pb-6">
          <div className="flex md:flex-row flex-col w-full items-stretch content-stretch justify-center gap-6">
            <QueueCard
              kind="personal"
              slug={slug}
              data={safeQueueSnapshot.personal}
              nextTicketNumber={nextNumbers?.nextPersonalNumber}
              minPriorityTipCents={minPriorityTipCents}
            />
            {safeQueueSnapshot.priority.enabled && (
              <QueueCard
                kind="priority"
                slug={slug}
                data={safeQueueSnapshot.priority}
                nextTicketNumber={nextNumbers?.nextPriorityNumber}
                minPriorityTipCents={minPriorityTipCents}
              />
            )}
          </div>
        </main>
        <footer className="py-6">
          <div className="flex md:flex-row flex-col items-center justify-between gap-2 md:gap-0">
            <a
              href="/about"
              className="bg-greenlite px-6 py-1 uppercase md:w-1/3 w-full"
              style={{ fontFamily: "var(--font-body)" }}
            >
              I WANT TO DO FAVORS TOO
            </a>
            <a
              href="https://twilightfringe.com"
              className="bg-blue-2 px-6 py-1 uppercase text-xs"
              target="_blank"
              style={{ fontFamily: "var(--font-body)" }}
            >
              please please please! is a proof of concept by <span className="font-bold">twilight fringe</span>
            </a>
          </div>
        </footer>
      </div>

      {/* Tracking Modal */}
      <TrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
      />
    </div>
  );
}
