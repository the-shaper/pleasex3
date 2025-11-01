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

export interface DashboardHeaderProps {
  title?: string;
  className?: string;
  // Removed unused onMenuClick - simplify unless needed
}

export default function DashboardHeader({
  title = "PLEASE PLEASE PLEASE",
  className = "",
}: DashboardHeaderProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk(); // Fixed: Use useClerk for signOut
  const router = useRouter();

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
    <div data-element="HEADER" className={`col-span-2 ${className}`}>
      <div className="flex justify-between items-start">
        <div
          data-element="HEADER-TITLES-WRAPPER"
          className="flex flex-col gap-2"
        >
          <p className="text-sm bg-purple text-text-bright w-fit py-1 px-2">
            DASHBOARD
          </p>
          <h1 className="text-3xl font-bold">{title}</h1>
          <SignedIn>
            <p className="uppercase text-text-muted">
              {user?.firstName || user?.fullName || "User"}
            </p>
          </SignedIn>
          <SignedOut>
            <p className="uppercase text-text-muted text-sm">
              Sign in to continue
            </p>
          </SignedOut>
        </div>
        <div
          data-element="HEADER-CONTROLS-WRAPPER"
          className="flex flex-col gap-2"
        >
          <SignedIn>
            <ButtonBase
              variant="default"
              size="sm"
              onClick={handleSignOut}
              className="text-xs"
            >
              SIGN OUT
            </ButtonBase>
          </SignedIn>
          <SignedOut>
            {/* Simple sign-in button - no sign-up */}
            <SignInButton mode="modal">
              <ButtonBase variant="default" size="sm" className="text-xs">
                SIGN IN
              </ButtonBase>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
