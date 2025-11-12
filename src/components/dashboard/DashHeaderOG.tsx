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

export interface DashboardHeaderProps {
  title?: string;
  className?: string;
  onMenuClick?: () => void; // NEW: Prop for menu toggle
  isOpen?: boolean; // NEW: Prop for menu state
  // Removed unused onMenuClick - simplify unless needed
}

export default function DashboardHeader({
  title = "PLEASE PLEASE PLEASE",
  className = "",
  onMenuClick, // NEW: Destructure
  isOpen, // NEW: Destructure
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
          <div className="flex flex-row items-start gap-2 md:gap-0">
            {/* NEW: MenuButton just before DASHBOARD tag */}
            {onMenuClick && (
              <MenuButton
                onClick={onMenuClick}
                isOpen={isOpen || false}
                className="md:hidden self-start mb-2"
              />
            )}
            <p className="text-sm bg-purple text-text-bright w-fit py-1 px-2">
              DASHBOARD
            </p>
            <SignedIn>
              <p className="uppercase text-text-muted -mt-2">
                Hello,{user?.firstName || user?.fullName || "User"}!
              </p>
            </SignedIn>
            <SignedOut>
              <p className="uppercase text-text-muted text-sm">
                Sign in to continue
              </p>
            </SignedOut>
          </div>
          <h1 className="text-xl md:text-3xl text-nowrap font-bold">{title}</h1>
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
