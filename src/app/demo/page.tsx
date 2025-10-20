"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QueueCard from "../../../ui-backup/QueueCard";
import { ConvexDataProvider } from "@/lib/data/convex";

const dataProvider = new ConvexDataProvider();

export default function DemoQueuesPage() {
  const slug = "alejandro";
  const minPriorityTipCents = 1500;
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get creator info dynamically
  const [displayName, setDisplayName] = useState<string>("Loading...");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch queue data and creator info in parallel
        const [snapshot, creatorInfo] = await Promise.all([
          dataProvider.getQueueSnapshot(slug),
          dataProvider.getCreatorInfo?.(slug) ||
            Promise.resolve({ displayName: slug }),
        ]);

        setQueueData(snapshot);
        setDisplayName(creatorInfo.displayName || slug);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback to mock data if there's an error
        setQueueData({
          personal: {
            activeTurn: 0,
            nextTurn: 1,
            etaMins: 0,
            activeCount: 0,
            enabled: true,
          },
          priority: {
            activeTurn: 0,
            nextTurn: 1,
            etaMins: 0,
            activeCount: 0,
            enabled: true,
          },
        });
        setDisplayName(slug); // Fallback to slug as display name
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading || !queueData) {
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
              <span className="text-coral">{displayName}?</span>
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
            href={`/${slug}/submit`}
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
              data={queueData.personal}
              minPriorityTipCents={minPriorityTipCents}
            />
            <QueueCard
              kind="priority"
              slug={slug}
              data={queueData.priority}
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
