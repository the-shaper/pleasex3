"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { AboutModal } from "@/components/aboutModal";
import { TrackingModal } from "@/components/trackingModal";

export default function Home() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  // Modal state is derived from URL
  const isAboutModalOpen = pathname === "/about";
  const isTrackingModalOpen = pathname === "/tracking";

  // Derive the user's slug (matches dashboard logic)
  const userSlug = user?.username || user?.primaryEmailAddress?.emailAddress || null;

  return (
    <>
      <div className={`w-full font-space grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 sm:p-20 bg-[url('/px3-hands.svg')] bg-cover bg-center transition-all ${isAboutModalOpen || isTrackingModalOpen ? 'blur-sm' : ''}`}>
        <main className="grid grid-rows-[auto_1fr_1fr] md:grid-rows-3 row-start-2 h-full" id="titles">
          {/* Row 1: Signed in status */}
          <div className="flex items-start justify-center pb-4">
            {isLoaded && user && userSlug && (
              <h6 className="text-xs font-bold text-text uppercase tracking-widest">
                signed in as <a href={`/${userSlug}`} className="text-text underline hover:opacity-80 transition-opacity cursor-pointer">{user.firstName || user.fullName}</a>
              </h6>
            )}
          </div>

          {/* Row 2: Titles */}
          <div className="p-8 flex flex-col items-center justify-center w-full max-w-full">
            <h1 className="md:hidden text-6xl sm:text-5xl font-bold text-text tracking-tighter leading-[0.8] text-center break-words max-w-full">PLEASE PLEASE PLEASE</h1>
            <h2 className="md:hidden text-center text-xl sm:text-2xl text-text md:tracking-[1.77rem] leading-[1] break-words max-w-full mt-2">VIRTUAL TICKET MACHINE</h2>
            <img src="/px3-maintitle.svg" alt="" className="hidden md:flex  w-2/3 h-full text-text" />
          </div>

          {/* Row 3: Nav buttons centered within this row */}
          <div className="flex items-center justify-center w-full">
            <div className="flex gap-1 items-center flex-col w-full max-w-full">
              {isLoaded && !user && (
                <a href="/sign-up" className="text-text px-4 py-1 font-bold text-2xl sm:text-3xl cursor-pointer hover:underline text-center">NEW GAME</a>
              )}



              <a href={userSlug ? `/${userSlug}/dashboard` : "/sign-in"} className="text-text px-4 py-1 font-bold text-2xl sm:text-3xl cursor-pointer hover:underline text-center">CONTINUE</a>


              {isLoaded && userSlug && (
                <button onClick={() => signOut({ redirectUrl: '/' })} className="text-text px-4 py-2 font-bold text-2xl sm:text-3xl cursor-pointer hover:underline uppercase text-center">SIGN OUT</button>
              )}

              {isLoaded && !user && (
                <button onClick={() => router.push("/tracking")} className="text-text px-4 py-1 font-bold text-2xl sm:text-3xl cursor-pointer hover:underline text-center">TRACK MY FAVOR</button>
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
          <h6>PLEASE PLEASE PLEASE IS A PROOF OF CONCEPT BY TWILIGHT FRINGE.</h6>
        </footer>
      </div>

      {/* Modals - Outside the blurred container */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => router.push("/")}
      />
      <TrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => router.push("/")}
      />
    </>
  );
}
