"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AboutModal } from "@/components/aboutModal";
import { TrackingModal } from "@/components/trackingModal";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { HandsBackground } from "@/components/HandsBackground";
import { StatusBar } from "@/components/dashboard/statusBar";

function TrackingModalWithRef() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const trackingRef = searchParams.get("ref") || "";
  const isTrackingModalOpen = pathname === "/tracking";

  return (
    <TrackingModal
      isOpen={isTrackingModalOpen}
      onClose={() => router.push("/")}
      initialRef={trackingRef}
    />
  );
}

export default function Home() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  // Modal state is derived from URL
  const isAboutModalOpen = pathname === "/about";
  const isTrackingModalOpen = pathname === "/tracking";

  // Derive the user's slug (matches dashboard logic)
  const userSlug =
    user?.username || user?.primaryEmailAddress?.emailAddress || null;

  // Query creator status metrics (only when signed in and has slug)
  const statusMetrics = useQuery(
    api.dashboard.getCreatorStatusMetrics,
    userSlug ? { creatorSlug: userSlug } : "skip"
  );

  return (
    <>
      <HandsBackground
        className={`fixed inset-0 -z-10 transition-all ${isAboutModalOpen || isTrackingModalOpen ? "blur-md" : ""}`}
        showControls={false}
        showShaderControls={false}
      />
      <div
        className={`w-full font-space grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 sm:p-20 transition-all ${isAboutModalOpen || isTrackingModalOpen ? "blur-sm" : ""}`}
      >
        <main
          className="grid grid-rows-[auto_1fr_1fr] md:grid-rows-3 row-start-2 h-full"
          id="titles"
        >
          {/* Row 1: Signed in + status bar */}
          <div className="flex flex-row items-start justify-center gap-1">
            <a
              href={`/${userSlug}`}
              className="flex items-start justify-center"
            >
              {isLoaded && user && userSlug && (
                <h6 className="text-xs font-bold text-text uppercase tracking-widest border bg-bg py-2 px-4">
                  signed in as{" "}
                  <span className="text-text underline">{userSlug}</span>
                </h6>
              )}
            </a>
            {isLoaded && user && userSlug && statusMetrics && (
              <StatusBar
                queuedTasks={statusMetrics.queuedTasks}
                newRequests={statusMetrics.newRequests}
                userSlug={userSlug}
                variant="dark"
              />
            )}
          </div>

          {/* Row 2: Titles */}
          <div className="md:p-8 pt-3 flex flex-col md:items-center items-start justify-center w-full max-w-full">
            <h1 className="md:hidden text-6xl sm:text-5xl font-bold text-text tracking-tighter leading-[0.8] text-left break-words max-w-full">
              PLEASE PLEASE PLEASE!
            </h1>
            <h2 className="md:hidden text-left text-xl sm:text-2xl text-text md:tracking-[1.77rem] leading-[1] break-words max-w-full mt-2">
              VIRTUAL TICKET MACHINE
            </h2>
            <img
              src="/px3-maintitle.svg"
              alt=""
              className="hidden md:flex  w-2/3 h-full text-text"
            />
          </div>

          {/* Row 3: Nav buttons centered within this row */}
          <div className="flex items-center justify-center w-full">
            <div className="flex gap-1 items-center flex-col w-full max-w-full">
              {isLoaded && !user && (
                <a
                  href="/sign-up"
                  className="text-text px-4 py-1 font-bold text-2xl sm:text-3xl cursor-pointer hover:underline text-center"
                >
                  NEW GAME
                </a>
              )}

              <a
                href={userSlug ? `/${userSlug}/dashboard` : "/sign-in"}
                className="text-text px-4 py-1 font-bold text-2xl sm:text-3xl cursor-pointer hover:underline text-center"
              >
                {userSlug ? "DASHBOARD" : "CONTINUE"}
              </a>

              {isLoaded && userSlug && (
                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="text-text px-4 py-2 font-bold text-2xl sm:text-3xl cursor-pointer hover:underline uppercase text-center"
                >
                  SIGN OUT
                </button>
              )}

              {isLoaded && !user && (
                <button
                  onClick={() => router.push("/tracking")}
                  className="text-text px-4 py-1 font-bold text-2xl sm:text-3xl cursor-pointer hover:underline text-center"
                >
                  TRACK MY FAVOR
                </button>
              )}

              <button
                onClick={() => router.push("/about")}
                className="text-text px-4 py-2 font-bold text-2xl sm:text-3xl cursor-pointer hover:underline text-center"
              >
                WHAT IS THIS?
              </button>
            </div>
          </div>
        </main>
        <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-center text-xs">
          <h6>
            PLEASE PLEASE PLEASE IS A PROOF OF CONCEPT BY{" "}
            <span
              className="font-bold cursor-pointer"
              onClick={() =>
                window.open("https://twilightfringe.com", "_blank")
              }
            >
              TWILIGHT FRINGE
            </span>
            .
          </h6>
        </footer>
      </div>

      {/* Modals - Outside the blurred container */}
      <AboutModal isOpen={isAboutModalOpen} onClose={() => router.push("/")} />
      <Suspense fallback={null}>
        <TrackingModalWithRef />
      </Suspense>
    </>
  );
}
