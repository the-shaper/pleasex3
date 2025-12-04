"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SideBar } from "@/components/sidebar/sideBar";

import { TableComponent } from "@/components/dashboard/table/tableComponent";

import {
  TaskTag,
  QueueSnapshot,
  DashboardOverview,
  Ticket,
  SidebarSectionProps,
} from "@/lib/types";
import type { TicketPosition } from "../../../../convex/lib/ticketEngine";
import { useSearchParams } from "next/navigation";
import { QueueSettings } from "@/components/dashboard/QueueSettings";
import DashHeaderOG from "@/components/dashboard/DashHeaderOG";
import { ConvexDataProvider } from "@/lib/data/convex";
import { CellComponentData } from "@/components/dashboard/table/cellComponent";
import TaskModule from "@/components/dashboard/taskModule/taskModule";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api"; // Generated Convex API via path alias
import { TaskCardData } from "@/components/taskcard";
import NextUpSection from "@/components/dashboard/NextUpSection";
import { EarningsPanel } from "@/components/dashboard/earnings/EarningsPanel";
import { StripeOnboardingBanner } from "@/components/dashboard/StripeOnboardingBanner";
import { ResizableDivider } from "@/components/dashboard/ResizableDivider";
import { MyAccount } from "@/components/dashboard/MyAccount";
import { ReadMeModal } from "@/components/readMeModal";

const dataProvider = new ConvexDataProvider();

export default function DashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  // All hooks first: Consistent order every render
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  // Reactive queries - automatically authenticated and updated
  const creator = useQuery(api.dashboard.getCreator, { creatorSlug: slug });

  // Check ownership:
  // 1. Must be loaded and signed in.
  // 2. Creator info must be loaded.
  // 3. If creator has a clerkUserId, it must match the current user.
  const isOwner =
    isLoaded &&
    isSignedIn &&
    creator !== undefined &&
    (creator === null ||
      !creator.clerkUserId ||
      creator.clerkUserId === user?.id);

  const shouldFetch = isOwner;

  const queueSnapshot = useQuery(
    api.queues.getSnapshot,
    shouldFetch ? { creatorSlug: slug } : "skip"
  );
  const dashboardOverview = useQuery(
    api.dashboard.getOverview,
    shouldFetch
      ? {
          creatorSlug: slug,
        }
      : "skip"
  );
  const positions = useQuery(
    api.dashboard.getAllTicketsWithPositions,
    shouldFetch
      ? {
          creatorSlug: slug,
        }
      : "skip"
  );
  const activePositions = useQuery(
    api.dashboard.getActiveTicketPositions,
    shouldFetch
      ? {
          creatorSlug: slug,
        }
      : "skip"
  );
  const earningsData = useQuery(
    api.lib.stripeEngine.getEarningsDashboardData,
    shouldFetch
      ? {
          creatorSlug: slug,
        }
      : "skip"
  );

  const [personalEnabled, setPersonalEnabled] = useState(false);
  const [priorityEnabled, setPriorityEnabled] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [splitPercentage, setSplitPercentage] = useState(50); // For resizable divider
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false); // For FAQ modal

  // Unauth or Non-Owner: redirect
  useEffect(() => {
    if (!isLoaded) return;

    // 1. Not signed in -> Redirect to sign-in
    if (!isSignedIn) {
      const redirectUrl =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : `/${slug}/dashboard`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    // 2. Signed in but not owner -> Redirect to home
    if (creator !== undefined) {
      // If creator exists and has an ID, and it doesn't match -> Redirect
      if (creator && creator.clerkUserId && creator.clerkUserId !== user?.id) {
        console.warn(
          "Unauthorized access attempt to dashboard. Redirecting to home."
        );
        router.push("/");
      }
    }
  }, [isLoaded, isSignedIn, router, slug, creator, user]);

  useEffect(() => {
    console.log("DEBUG engine positions", positions);
    // Log detailed info about awaiting-feedback tickets
    const awaitingTickets = positions?.filter(
      (p) => p.tag === "awaiting-feedback"
    );
    if (awaitingTickets && awaitingTickets.length > 0) {
      console.log("DEBUG awaiting-feedback tickets:", awaitingTickets);
    }
  }, [positions]);

  // Debug: Log when selectedTask changes
  useEffect(() => {
    console.log(
      "🔄 Dashboard: selectedTask changed to:",
      selectedTask?.ref || "null"
    );
  }, [selectedTask]);

  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "active";

  // Ensure a Convex creator exists for this slug when a signed-in user visits the dashboard
  const upsertCreator = useMutation(api.creators.upsertBySlug);
  const toggleQueue = useMutation(api.queues.toggleEnabled);
  const connectStripeAction = useAction(
    api.stripeOnboarding.createStripeAccountLink
  );
  const verifyStripeStatus = useAction(
    api.stripeOnboarding.verifyAndSyncStripeStatus
  );
  const recomputeWorkflowTags = useMutation(
    api.tickets.recomputeWorkflowTagsForCreator
  );

  // Auto-verify Stripe status when on earnings tab with incomplete onboarding
  useEffect(() => {
    if (
      tab === "earnings" &&
      earningsData?.connection?.onboardingStarted &&
      slug
    ) {
      console.log(
        "[Dashboard] Verifying Stripe status for incomplete onboarding..."
      );
      verifyStripeStatus({ creatorSlug: slug })
        .then((result) => {
          console.log("[Dashboard] Stripe verification result:", result);
        })
        .catch((err) => {
          console.error("[Dashboard] Failed to verify Stripe status:", err);
        });
    }
  }, [
    tab,
    earningsData?.connection?.onboardingStarted,
    slug,
    verifyStripeStatus,
  ]);

  useEffect(() => {
    // Skip if not signed in or not loaded
    if (!isLoaded || !isSignedIn || !slug) return;

    const displayName =
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      (typeof user?.firstName === "string" && user.firstName
        ? user.firstName
        : slug);

    upsertCreator({
      slug,
      displayName,
      minPriorityTipCents: 5000,
    }).catch((err) => {
      console.error("Failed to upsert creator", err);
    });
  }, [isLoaded, isSignedIn, slug, upsertCreator, user]);

  const dashboardSections: SidebarSectionProps[] = [
    {
      title: "Favors",
      links: [
        { href: "?tab=active", label: "Active" },
        { href: "?tab=past", label: "Past" },
        { href: "?tab=all", label: "All" },
      ],
    },
    {
      title: "My Page",
      links: [
        { href: "?tab=queue-settings", label: "Queue Settings" },
        { href: "?tab=account", label: "My Account" },
      ],
    },
    {
      title: "Earnings",
      links: [{ href: "?tab=earnings", label: "Earnings" }],
    },
  ];

  // Derived state for queue settings
  useEffect(() => {
    if (queueSnapshot) {
      setPersonalEnabled(queueSnapshot.personal.enabled);
      setPriorityEnabled(queueSnapshot.priority.enabled);
    }
  }, [queueSnapshot]);

  // Loading state is now derived from the queries
  const isLoading =
    queueSnapshot === undefined || dashboardOverview === undefined;

  // Error handling is implicit (undefined result while loading), or we can check for null if the query returns null on error
  // For now, we'll rely on the loading state. If queries fail due to auth, they will throw or return undefined depending on setup.
  // But since we are fixing auth, we expect them to work.

  // New useEffect for body overflow on mobile sidebar open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  // useEffect to detect desktop breakpoint
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
    };

    checkDesktop();

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    mediaQuery.addEventListener("change", checkDesktop);

    return () => {
      mediaQuery.removeEventListener("change", checkDesktop);
    };
  }, []);

  // Early returns: AFTER all hooks

  // 1. Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Loading session...</h2>
        </div>
      </div>
    );
  }

  // 2. If not signed in, return null (redirect handled by useEffect)
  if (!isSignedIn) {
    return null;
  }

  // 3. If signed in but data is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Loading dashboard...</h2>
          <p className="text-gray-600">
            Fetching latest queue and ticket data.
          </p>
        </div>
      </div>
    );
  }

  const handleTicketUpdate = async () => {
    // No-op: queries are reactive and will update automatically
    // We might want to trigger a re-computation if needed, but for now we can rely on reactivity
  };

  // UPDATED: Enhanced handleOpenTicket for table row clicks
  const handleOpenTicket = async (ref: string) => {
    console.log("🔍 handleOpenTicket called with ref:", ref);

    try {
      if (!queueSnapshot || !dashboardOverview) {
        console.warn("Cannot open ticket: Missing queue or overview data");
        return;
      }

      const ticket = await dataProvider.getTicketByRef(ref);
      console.log("🔍 Fetched ticket:", ticket);
      if (!ticket) {
        console.warn(`Ticket not found for ref: ${ref}`);
        return;
      }

      const queueKind = ticket.queueKind as "personal" | "priority";
      const queue = queueSnapshot[queueKind];
      console.log("🔍 Queue kind:", queueKind, "Queue data:", queue);
      if (!queue) {
        console.warn(`No queue snapshot for ${queueKind}`);
        return;
      }

      // Determine relevant tickets only for ACTIVE logic; allow all statuses for PAST/ALL
      let relevantTickets: Ticket[] | null = null;

      if (ticket.status === "approved") {
        relevantTickets = dashboardOverview.approvedTickets;
      } else if (ticket.status === "open") {
        relevantTickets = dashboardOverview.openTickets;
      } else if (tab === "past" || tab === "all") {
        // Historical tabs: allow viewing any status; skip strict gate
        relevantTickets = null;
      } else {
        console.warn(
          `Ticket ${ref} is not open or approved (status: ${ticket.status})`
        );
        return;
      }

      if (relevantTickets) {
        console.log(
          "🔍 Relevant tickets length:",
          relevantTickets.length,
          "Status:",
          ticket.status
        );
      }

      // Compute position and status tag
      let computedStatus: "current" | "next-up" | "pending" = "pending";
      let ticketPosition = 1;

      if (relevantTickets) {
        if (ticket.status === "approved") {
          const position = activePositions?.find((p) => p.ref === ticket.ref);
          if (position?.tag === "current") computedStatus = "current";
          else if (position?.tag === "next-up") computedStatus = "next-up";
          else computedStatus = "pending";
        } else if (ticket.status === "open") {
          computedStatus = "pending";
        }

        const sameQueueTickets = relevantTickets
          .filter((t) => t.queueKind === queueKind)
          .sort((a, b) => a.createdAt - b.createdAt);

        ticketPosition =
          sameQueueTickets.findIndex((t) => t.ref === ref) + 1 || 1;
        console.log("🔍 Calculated position:", ticketPosition);
      } else {
        // PAST/ALL fallback: keep simple pending-like label; position 1 (not shown prominently)
        computedStatus = "pending";
        ticketPosition = 1;
      }

      const taskCardData: TaskCardData = {
        currentTurn: ticketPosition,
        nextTurn: ticketPosition,
        etaDays: queue.etaDays ?? null,
        activeCount: queue.activeCount,
        enabled: queue.enabled,
        name: ticket.name || "Anonymous",
        email: ticket.email || "user@example.com",
        phone: ticket.phone || "",
        location: ticket.location || "",
        social: ticket.social || "",
        needText: ticket.taskTitle || "No description provided",
        message: ticket.message || "No description provided",
        attachments: ticket.attachments || [],
        tipCents: ticket.tipCents || 0,
        queueKind,
        status: computedStatus,
        tags: [computedStatus] as TaskTag[],
        createdAt: ticket.createdAt,
        ref: ticket.ref,
      };
      console.log("🔍 Built TaskCardData:", taskCardData);

      setSelectedTask(taskCardData);

      // Modal behavior depends on tab:
      // - PAST / ALL: always open modal on click (desktop + mobile).
      // - ACTIVE: keep existing behavior (inline desktop panel, mobile modal handled elsewhere).
      if (tab === "past" || tab === "all") {
        setIsModalOpen(true);
      } else if (!isDesktop) {
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Error opening ticket:", err);
      setSelectedTask(null);
    }
  };

  const closeModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
  };

  // Handler for opening task from TaskCard "OPEN TASK" button
  const handleOpenTaskCard = (data: TaskCardData) => {
    console.log("🔍 handleOpenTaskCard called with ref:", data.ref);
    setSelectedTask(data);
    // Open modal on mobile
    if (!isDesktop) {
      setIsModalOpen(true);
    }
  };

  // Helper function to sort tickets with 3:1 priority-to-personal ratio

  const overview = dashboardOverview;

  // Build lookup map from tickets by ref using latest overview
  const ticketByRef: Record<string, Ticket> = {};
  if (overview) {
    [
      ...overview.openTickets,
      ...overview.approvedTickets,
      ...overview.closedTickets,
      ...overview.rejectedTickets,
      ...overview.pendingPaymentTickets,
    ].forEach((t) => {
      ticketByRef[t.ref] = t;
    });
  }

  // Helper to map engine positions + ticket docs into CellComponentData
  const mapPositionsToCellData = (
    posList: TicketPosition[] | null | undefined
  ): CellComponentData[] => {
    if (!posList || !overview) return [];

    return posList.map((p) => {
      const t = ticketByRef[p.ref];
      const status =
        (t?.status as CellComponentData["status"]) ?? p.status ?? "open";
      const isNumbered = status === "approved" || status === "closed";

      const generalNumber = isNumbered ? (p.ticketNumber ?? null) : null;
      const ticketNumber = isNumbered
        ? (p.queueNumber ?? p.ticketNumber ?? null)
        : null;

      const mergedTags = p.tag
        ? Array.from(new Set([p.tag, ...((t?.tags as string[]) || [])]))
        : (t?.tags as string[]) || [];

      return {
        ref: p.ref,
        generalNumber,
        ticketNumber,
        queueKind: p.queueKind,
        status,
        task:
          t?.taskTitle ||
          t?.message ||
          (t?.queueKind === "priority"
            ? "Priority request"
            : "Personal request"),
        submitterName: t?.name || "Anonymous",
        requestDate: t?.createdAt ?? 0,
        tipCents: t?.tipCents ?? 0,
        tags: mergedTags,
        resolvedAt: t?.resolvedAt,
      };
    });
  };

  // Unified table data for all tabs - TableComponent will handle visual filtering
  const tableRows: CellComponentData[] = mapPositionsToCellData(positions);
  // Active table rows from engine-sorted active positions
  const activeTableRows: CellComponentData[] =
    mapPositionsToCellData(activePositions);

  // Show error state
  if (!queueSnapshot || !overview) {
    return (
      <div
        id="DASHBOARD-LAYOUT"
        className="grid grid-cols-[250px_1fr] grid-rows-[auto_1fr] h-screen md:overflow-hidden  bg-bg p-8 w-full"
      >
        <DashHeaderOG />
        <div className="col-start-2 row-start-2 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">
              Error loading dashboard
            </h2>
            <p className="text-gray-600 mb-4">Failed to load data</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const queues = queueSnapshot;

  // Engine positions from ticketEngine (already queried above)
  const enginePositions = positions || [];

  // Compute static max queueNumber per queueKind for "out of" labels
  const maxPersonalQueueNumber = Math.max(
    0,
    ...enginePositions
      .filter(
        (p) => p.queueKind === "personal" && typeof p.queueNumber === "number"
      )
      .map((p) => p.queueNumber as number)
  );

  const maxPriorityQueueNumber = Math.max(
    0,
    ...enginePositions
      .filter(
        (p) => p.queueKind === "priority" && typeof p.queueNumber === "number"
      )
      .map((p) => p.queueNumber as number)
  );

  // Approved task cards for NextUpSection = all engine-approved positions in UI order (awaiting-feedback first)
  const approvedPositions = activePositions || [];

  // Use engine positions directly - they are already sorted by 3:1 logic and queue number
  const orderedPositions = approvedPositions;

  // Debug: Log the 3:1 ordering
  console.log("DEBUG 3:1 ticket ordering:", {
    original: approvedPositions.map((p) => ({
      ref: p.ref,
      tag: p.tag,
      queueKind: p.queueKind,
    })),
    sorted: orderedPositions.map((p) => ({
      ref: p.ref,
      tag: p.tag,
      queueKind: p.queueKind,
    })),
  });

  const nextUpTaskCards: TaskCardData[] = orderedPositions.map((p, index) => {
    const t = ticketByRef[p.ref];
    const displayNumber = p.queueNumber ?? p.ticketNumber ?? index + 1;
    const totalInQueue =
      p.queueKind === "personal"
        ? maxPersonalQueueNumber
        : maxPriorityQueueNumber;

    const needText = t?.taskTitle || "No description provided";

    return {
      // Use static engine-assigned number for display
      currentTurn: displayNumber,
      nextTurn: displayNumber,
      // Static "out of" based on highest queueNumber for this queueKind
      activeCount: totalInQueue,
      // Queue-level metrics from general snapshot
      etaDays: queues?.general?.etaDays ?? null,
      enabled: queues?.general?.enabled ?? true,
      // Ticket details
      name: t?.name || "Anonymous",
      email: t?.email || "user@example.com",
      phone: t?.phone || "",
      location: t?.location || "",
      social: t?.social || "",
      needText,
      message: t?.message || "No description provided",
      attachments: t?.attachments || [],
      tipCents: t?.tipCents || 0,
      queueKind: p.queueKind,
      status: (p.tag as TaskTag) || "pending",
      tags: p.tag ? [p.tag as TaskTag] : (t?.tags as TaskTag[]) || [],
      createdAt: t?.createdAt || 0,
      ref: p.ref,
    } satisfies TaskCardData;
  });

  // Derive autoqueue card as the engine-marked current ticket (if any)
  const currentPosition = enginePositions.find((p) => p.tag === "current");
  const autoqueueCardData: TaskCardData | null = currentPosition
    ? (() => {
        const t = ticketByRef[currentPosition.ref];
        const displayNumber =
          currentPosition.queueNumber ?? currentPosition.ticketNumber ?? 0;
        const totalInQueue =
          currentPosition.queueKind === "personal"
            ? maxPersonalQueueNumber
            : maxPriorityQueueNumber;
        return {
          currentTurn: displayNumber,
          nextTurn: displayNumber,
          etaDays: queues?.general?.etaDays ?? null,
          // Static "out of" for the queue this current ticket belongs to
          activeCount: totalInQueue,
          enabled: queues?.general?.enabled ?? true,
          name: t?.name || "Anonymous",
          email: t?.email || "user@example.com",
          phone: t?.phone || "",
          location: t?.location || "",
          social: t?.social || "",
          needText: t?.taskTitle || "No description provided",
          message: t?.message || "No description provided",
          attachments: t?.attachments || [],
          tipCents: t?.tipCents || 0,
          queueKind: currentPosition.queueKind,
          status: "current",
          tags: ["current" as TaskTag],
          createdAt: t?.createdAt || 0,
          ref: currentPosition.ref,
        } satisfies TaskCardData;
      })()
    : null;

  // Approved task cards for NextUpSection = all engine-approved positions in UI order (awaiting-feedback first)
  const approvedTaskCards: TaskCardData[] = nextUpTaskCards;

  // Check if there are pending approvals to conditionally show the column
  // Include both open tickets (free submissions) and pendingPayment tickets (paid submissions after auth)
  const ticketsAwaitingApproval = [
    ...(overview?.openTickets || []),
    ...(overview?.pendingPaymentTickets || []),
  ];
  const hasPendingApprovals = ticketsAwaitingApproval.length > 0;

  // DEBUG: Log approval panel visibility
  console.log("[Dashboard] Approval Panel Debug:", {
    hasDashboardOverview: !!dashboardOverview,
    hasOverview: !!overview,
    openTicketsCount: overview?.openTickets?.length || 0,
    pendingPaymentCount: overview?.pendingPaymentTickets?.length || 0,
    totalAwaitingApproval: ticketsAwaitingApproval.length,
    hasPendingApprovals,
    ticketsAwaitingApproval: ticketsAwaitingApproval.map((t) => ({
      ref: t.ref,
      status: t.status,
    })),
  });

  // autoqueue current card removed; NEXT UP is driven purely by engine positions

  return (
    <>
      {/* Stripe Onboarding Banner - Full Width */}
      <StripeOnboardingBanner
        hasStripeAccount={!!creator?.stripeAccountId}
        onNavigateToEarnings={() => {
          const url = new URL(window.location.href);
          url.searchParams.set("tab", "earnings");
          router.push(url.pathname + url.search);
        }}
      />
      <div
        id="DASHBOARD-LAYOUT"
        className="grid grid-cols-[0px_1fr] md:grid-cols-[250px_1fr] grid-rows-[auto_1fr] h-screen overflow-hidden overflow-x-visible bg-bg p-8" // Updated grid for mobile (0px sidebar col)
      >
        {/* Header - spans full width */}
        <DashHeaderOG
          onMenuClick={() => setIsSidebarOpen(true)}
          isOpen={isSidebarOpen}
          onFaqClick={() => setIsFaqModalOpen(true)}
        />

        {/* Desktop sidebar (static, correct spacing) */}
        <div
          data-element="SIDEBAR-WRAPPER-DESKTOP"
          className="col-start-1 row-start-2 overflow-y-auto pt-4 hidden md:block"
        >
          <SideBar
            sections={dashboardSections}
            currentTab={tab}
            mobileOverlay={false}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            data-element="SIDEBAR-WRAPPER-MOBILE"
            className="fixed inset-y-0 left-0 z-50 w-64 bg-bg/90 backdrop-blur-xs shadow-lg md:hidden"
          >
            <SideBar
              sections={dashboardSections}
              currentTab={tab}
              mobileOverlay={true}
              isOpen={true}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div
          data-element="MAIN-CONTENT-WRAPPER"
          className="flex md:w-full w-[calc(100svw-4rem)] flex-col md:col-start-2 md:row-start-2 md:overflow-hidden md:grid gap-4 md:p-4 md:h-[86svh] h-full md:overflow-y-hidden overflow-y-auto min-h-0 md:min-h-0 no-scrollbar"
        >
          {tab === "queue-settings" ? (
            <div className="col-span-2">
              <QueueSettings
                queueSnapshot={queueSnapshot ?? null}
                toggleQueue={toggleQueue}
                slug={slug}
                personalEnabled={personalEnabled}
                setPersonalEnabled={setPersonalEnabled}
                priorityEnabled={priorityEnabled}
                setPriorityEnabled={setPriorityEnabled}
                minPriorityTipCents={
                  dashboardOverview?.creator?.minPriorityTipCents
                }
                hasStripeAccount={!!creator?.stripeAccountId}
                onNavigateToEarnings={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("tab", "earnings");
                  router.push(url.pathname + url.search);
                }}
              />
            </div>
          ) : tab === "account" ? (
            <div className="col-span-2">
              <MyAccount
                slug={slug}
                displayName={creator?.displayName || ""}
                email={creator?.email}
              />
            </div>
          ) : tab === "past" || tab === "all" ? (
            // PAST + ALL: table view backed by engine positions
            <div className="flex flex-col w-full flex-1 overflow-hidden">
              <TableComponent
                data={tableRows}
                onOpen={handleOpenTicket}
                activeTaskRef={selectedTask?.ref}
                enableClickToScroll={false}
                disableFocusStyling={false}
                variant={tab === "past" ? "past" : "all"}
                className="flex-1"
              />
            </div>
          ) : tab === "earnings" ? (
            <div className="flex flex-col w-full gap-6">
              <EarningsPanel
                data={earningsData}
                onConnectStripe={async () => {
                  if (!slug) return;
                  try {
                    const { url } = await connectStripeAction({
                      creatorSlug: slug,
                    });
                    if (url && typeof window !== "undefined") {
                      window.open(url, "_blank");
                      router.refresh();
                    }
                  } catch (error) {
                    console.error(
                      "Failed to create Stripe account link",
                      error
                    );
                  }
                }}
              />
            </div>
          ) : (
            <div
              className={`flex flex-col w-full no-scrollbar md:grid md:gap-4 h-full md:h-[86svh] min-h-0 md:min-h-0 ${
                hasPendingApprovals
                  ? "w-full md:grid-cols-[400px_1fr]"
                  : "w-full md:grid-cols-[400px_1fr]"
              }`}
            >
              <NextUpSection
                approvedTaskCards={approvedTaskCards}
                activeTaskRef={selectedTask?.ref}
                onOpen={handleOpenTaskCard}
                hasPendingApprovals={hasPendingApprovals}
                openTickets={ticketsAwaitingApproval}
                onTicketUpdate={handleTicketUpdate}
                queueSnapshot={queueSnapshot}
              />

              <div className="flex flex-col h-full min-h-0">
                {(selectedTask || autoqueueCardData) && (
                  <div
                    data-element="TASK-MODULE"
                    className="hidden md:block overflow-hidden"
                    style={{ height: `${splitPercentage}%` }}
                  >
                    <TaskModule
                      data={(selectedTask || autoqueueCardData) as TaskCardData}
                      onMarkAsFinished={async () => {
                        try {
                          setSelectedTask(null);

                          // Recompute workflow tags so NEXT UP reflects closed ticket removal.
                          try {
                            await recomputeWorkflowTags({ creatorSlug: slug });
                          } catch (err) {
                            console.error(
                              "Failed to recompute workflow tags after finish",
                              err
                            );
                          }
                        } catch (err) {
                          console.error(
                            "Error refreshing dashboard data after finish:",
                            err
                          );
                        }
                      }}
                    />
                  </div>
                )}

                {(selectedTask || autoqueueCardData) && (
                  <ResizableDivider
                    onResize={setSplitPercentage}
                    className="hidden md:flex"
                  />
                )}

                <div
                  data-element="FAVORS-TABLE"
                  className="overflow-hidden min-h-0"
                  style={
                    isDesktop
                      ? {
                          height:
                            selectedTask || autoqueueCardData
                              ? `${100 - splitPercentage}%`
                              : "100%",
                        }
                      : undefined
                  }
                >
                  <TableComponent
                    data={tab === "active" ? activeTableRows : tableRows}
                    onOpen={handleOpenTicket}
                    activeTaskRef={selectedTask?.ref}
                    enableClickToScroll={true}
                    clickToScrollBreakpoint="desktop"
                    disableFocusStyling={true}
                    variant="active"
                    className="h-full"
                    disableCollapse={!!(selectedTask || autoqueueCardData)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Mobile backdrop for sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0  bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* NEW: TaskModule modal */}
      {isModalOpen && selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={`Detailed view for ticket ${selectedTask.ref}`}
        >
          <div
            className="bg-bg shadow-xl max-w-full max-h-[95vh] relative w-full md:max-w-3xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 z-10 text-gray-subtle hover:text-text transition-colors text-3xl font-bold p-1"
              aria-label="Close detailed view"
            >
              ×
            </button>

            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              <TaskModule
                data={selectedTask}
                isModal={true}
                className=""
                onSendForFeedback={() => {
                  closeModal();
                }}
                onMarkAsFinished={async () => {
                  try {
                    closeModal();

                    // Recompute workflow tags so NEXT UP reflects closed ticket removal.
                    try {
                      await recomputeWorkflowTags({ creatorSlug: slug });
                    } catch (err) {
                      console.error(
                        "Failed to recompute workflow tags after modal finish",
                        err
                      );
                    }
                  } catch (err) {
                    console.error(
                      "Error refreshing dashboard data after finish:",
                      err
                    );
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      <ReadMeModal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        title="Cheatsheet"
      />
    </>
  );
}
