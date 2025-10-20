import Link from "next/link";
import type { Metadata } from "next";
import QueueCard, { type QueueKind } from "./QueueCard";
import { fetchWithFallback } from "@/lib/base-url";

async function fetchQueue(slug: string) {
  const res = await fetchWithFallback(`/api/creators/${slug}/queue`, {
    next: { revalidate: 5 },
  });
  if (!res.ok) return null;
  return res.json();
}

function formatEtaMins(etaMins: number | null | undefined) {
  if (!etaMins || etaMins <= 0) return "—";
  if (etaMins < 60) return "<1h";
  const hours = Math.round(etaMins / 60);
  return `${hours}h`;
}

function formatEtaDate(etaMins: number | null | undefined) {
  if (!etaMins || etaMins <= 0) return "—";
  const ms = etaMins * 60 * 1000;
  const d = new Date(Date.now() + ms);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}.${dd}.${yy}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchQueue(slug);
  const name = data?.creator?.displayName || slug;
  return {
    title: `Please Please Please — ${name}`,
    description: "Join the queue",
  };
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchQueue(slug);
  if (!data)
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded border border-red-300 bg-red-50 text-red-800 p-4">
          <p className="font-medium">Creator not found</p>
          <p className="text-sm mt-1">Check the URL or try again.</p>
        </div>
      </div>
    );
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
              <span className="text-coral">{data.creator.displayName}?</span>
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
            href="/status"
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
              data={data.personal}
              minPriorityTipCents={data.creator.minPriorityTipCents}
            />
            <QueueCard
              kind="priority"
              slug={slug}
              data={data.priority}
              minPriorityTipCents={data.creator.minPriorityTipCents}
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
