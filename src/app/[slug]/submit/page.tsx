"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import SubmitClient from "./SubmitClient";
import { ConvexDataProvider } from "@/lib/data/convex";
import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const formattedUrl = convexUrl.startsWith("http") ? convexUrl : `https://${convexUrl}`;
const httpClient = new ConvexHttpClient(formattedUrl);

type QueuePayload = {
  creator: { slug: string; displayName: string; minPriorityTipCents: number };
  personal: any;
  priority: any;
  general: any;
  nextTicketNumber?: number;
  nextPersonalNumber?: number;
  nextPriorityNumber?: number;
};

const dataProvider = new ConvexDataProvider();

export default function SubmitPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [initialQueue, setInitialQueue] = useState<QueuePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueueData = async () => {
      try {
        const [snapshot, creatorInfo, nextNumbers] = await Promise.all([
          dataProvider.getQueueSnapshot(slug),
          dataProvider.getCreatorInfo?.(slug) ||
          Promise.resolve({
            displayName: slug,
            minPriorityTipCents: 1500,
          }),
          httpClient.query(api.dashboard.getNextTicketNumbers, { creatorSlug: slug }),
        ]);

        const creator = {
          slug,
          displayName: creatorInfo?.displayName || slug,
          minPriorityTipCents: creatorInfo?.minPriorityTipCents || 1500,
        };

        setInitialQueue({
          creator,
          personal: snapshot.personal,
          priority: snapshot.priority,
          general: snapshot.general,
          nextTicketNumber: nextNumbers.nextTicketNumber,
          nextPersonalNumber: nextNumbers.nextPersonalNumber,
          nextPriorityNumber: nextNumbers.nextPriorityNumber,
        });
      } catch (error) {
        console.error("Error fetching queue data:", error);
        // Fallback to mock data if there's an error
        setInitialQueue({
          creator: { slug, displayName: "Demo", minPriorityTipCents: 1500 },
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
          general: {
            activeTurn: 0,
            nextTurn: 2,
            etaMins: 0,
            activeCount: 0,
            enabled: true,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQueueData();
  }, [slug]);

  if (loading || !initialQueue) {
    return (
      <div className="min-h-screen bg-bg py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Loading queue information...
          </h1>
          <p className="text-gray-600">
            Please wait while we fetch the latest queue status.
          </p>
        </div>
      </div>
    );
  }

  return <SubmitClient slug={slug} initialQueue={initialQueue} />;
}
