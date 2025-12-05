"use client";

import { ButtonBase } from "../general/buttonBase";
import {
  useUser,
  useClerk,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs"; // Updated: Added useClerk, removed useSignOut
import { useRouter } from "next/navigation";
import { MenuButton } from "@/components/sidebar/menuButton"; // NEW: Import MenuButton
import { StatusBar } from "./statusBar";

export interface DashboardHeaderProps {
  title?: string;
  className?: string;
  onMenuClick?: () => void; // NEW: Prop for menu toggle
  isOpen?: boolean; // NEW: Prop for menu state
  onFaqClick?: () => void; // NEW: Prop for FAQ modal toggle
  statusMetrics?: { queuedTasks: number; newRequests: number };
  userSlug?: string | null;
  // Removed unused onMenuClick - simplify unless needed
}

export default function DashboardHeader({
  title = "PLEASE PLEASE PLEASE!",
  className = "",
  onMenuClick, // NEW: Destructure
  isOpen, // NEW: Destructure
  onFaqClick, // NEW: Destructure for FAQ modal
  statusMetrics,
  userSlug: userSlugProp = null,
}: DashboardHeaderProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk(); // Fixed: Use useClerk for signOut
  const router = useRouter();

  // Derive the user's slug (matches dashboard logic)
  const userSlug =
    userSlugProp ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    null;

  // Early return for loading (prevents unauth flash)
  if (!isLoaded) {
    return (
      <div data-element="HEADER" className={`col-span-2 ${className}`}>
        <div className="flex justify-between items-start h-20 bg-bg animate-pulse" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut(); // Fixed: Direct signOut from clerk
    router.push("/"); // Redirect to home post-sign-out
  };

  return (
    <div
      data-element="HEADER"
      className={`col-span-2 ${className} md:pb-0 pb-2`}
    >
      <div className="flex md:flex-col flex-col-reverse gap-2">
        {/* Top row: DASHBOARD tag + MenuButton and Auth buttons */}
        <div className="flex md:justify-between justify-between md:items-center items-start">
          <div className="flex md:flex-row flex-col-reverse pr-2 md:items-center items-start gap-2">
            <div className="flex flex-row gap-2">
              {/* MenuButton on mobile */}
              {onMenuClick && (
                <div className="md:hidden">
                  <MenuButton onClick={onMenuClick} isOpen={isOpen || false} />
                </div>
              )}
              {/* DASHBOARD tag */}
              <p className="text-sm bg-purple text-text-bright w-fit py-1 px-2">
                DASHBOARD
              </p>
            </div>
            {isLoaded && user && userSlug && statusMetrics && (
              <div className="hidden md:flex">
                <StatusBar
                  queuedTasks={statusMetrics.queuedTasks}
                  newRequests={statusMetrics.newRequests}
                  userSlug={userSlug}
                  variant="light"
                  clickable={false}
                />
              </div>
            )}
          </div>

          {/* Auth buttons */}
          <div
            data-element="HEADER-CONTROLS-WRAPPER"
            className="hidden md:flex md:flex-row flex-col gap-1 "
          >
            <ButtonBase
              variant="default"
              size="sm"
              onClick={onFaqClick}
              className="text-xs hover:bg-gold cursor-pointer"
            >
              Cheatsheet
            </ButtonBase>

            <SignedIn>
              <ButtonBase
                variant="default"
                size="sm"
                onClick={() => router.push("/" + userSlug)}
                className="text-xs hover:bg-blue cursor-pointer "
              >
                Public Page
              </ButtonBase>

              <ButtonBase
                variant="default"
                size="sm"
                onClick={handleSignOut}
                className="text-xs hover:bg-coral cursor-pointer"
              >
                SIGN OUT
              </ButtonBase>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <ButtonBase variant="default" size="sm" className="text-xs">
                  SIGN IN
                </ButtonBase>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        {/* Bottom section: Username greeting and title */}
        <div data-element="HEADER-TITLES-WRAPPER" className="flex flex-col">
          <SignedIn>
            <p className="uppercase text-text-muted text-m">
              Hello,{" "}
              <span className="text-coral">{user?.username || "User"}!</span>
            </p>
          </SignedIn>
          <SignedOut>
            <p className="uppercase text-text-muted text-sm">
              Sign in to continue
            </p>
          </SignedOut>
          <h1 className="md:text-3xl text-2xl text-2xl text-nowrap font-bold tracking-tighter">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}
