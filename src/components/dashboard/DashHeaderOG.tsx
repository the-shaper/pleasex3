"use client";

import { ButtonBase } from "../general/buttonBase";
import {
  useUser,
  useClerk,
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

// View Component
export function DashHeaderContent({
  title = "PLEASE PLEASE PLEASE!",
  className = "",
  onMenuClick,
  isOpen,
  onFaqClick,
  statusMetrics,
  userSlug,
  username,
  isAuthenticated,
  isLoading,
  onPublicPageClick,
  onSignOutClick,
  onSignInClick,
  SignInWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>,
}: DashboardHeaderProps & {
  username?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onPublicPageClick: () => void;
  onSignOutClick: () => void;
  onSignInClick?: () => void;
  SignInWrapper?: React.ComponentType<{ children: React.ReactNode }>;
}) {
  // Early return for loading (prevents unauth flash)
  if (isLoading) {
    return (
      <div data-element="HEADER" className={`col-span-2 ${className}`}>
        <div className="flex justify-between items-start h-20 bg-bg animate-pulse" />
      </div>
    );
  }

  return (
    <div
      data-element="HEADER"
      className={`col-span-2 ${className} md:pb-0 pb-2 bg-bg`}
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
            {isAuthenticated && userSlug && statusMetrics && (
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

            {isAuthenticated ? (
              <>
                <ButtonBase
                  variant="default"
                  size="sm"
                  onClick={onPublicPageClick}
                  className="text-xs hover:bg-blue cursor-pointer "
                >
                  Public Page
                </ButtonBase>

                <ButtonBase
                  variant="default"
                  size="sm"
                  onClick={onSignOutClick}
                  className="text-xs hover:bg-coral cursor-pointer"
                >
                  SIGN OUT
                </ButtonBase>
              </>
            ) : (
              <SignInWrapper>
                <ButtonBase
                  variant="default"
                  size="sm"
                  className="text-xs"
                  onClick={onSignInClick}
                >
                  SIGN IN
                </ButtonBase>
              </SignInWrapper>
            )}
          </div>
        </div>

        {/* Bottom section: Username greeting and title */}
        <div data-element="HEADER-TITLES-WRAPPER" className="flex flex-col">
          {isAuthenticated ? (
            <p className="uppercase text-text-muted text-m">
              Hello,{" "}
              <span className="text-coral">{username || "User"}!</span>
            </p>
          ) : (
            <p className="uppercase text-text-muted text-sm">
              Sign in to continue
            </p>
          )}
          <h1 className="md:text-3xl text-2xl text-2xl text-nowrap font-bold tracking-tighter">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHeader(props: DashboardHeaderProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  // Derive the user's slug
  const userSlug =
    props.userSlug ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const username = user?.username || user?.primaryEmailAddress?.emailAddress;

  return (
    <DashHeaderContent
      {...props}
      isAuthenticated={!!isSignedIn}
      isLoading={!isLoaded}
      username={username || null}
      userSlug={userSlug}
      onPublicPageClick={() => router.push("/" + userSlug)}
      onSignOutClick={handleSignOut}
      SignInWrapper={SignInButton}
    />
  );
}
