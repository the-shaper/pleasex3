"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SideBar } from "@/components/sidebar/sideBar";
import { MenuButton } from "@/components/sidebar/menuButton"; // New import for mobile toggle
import { TableComponent } from "@/components/dashboard/table/tableComponent";
import TaskCard from "@/components/taskcard";
import ApprovalPanel from "@/components/dashboard/approvalPanel";
import {
  TaskTag,
  QueueSnapshot,
  DashboardOverview,
  Ticket,
  SidebarSectionProps,
} from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { QueueSettings } from "@/components/dashboard/QueueSettings";
import DashHeaderOG from "@/components/dashboard/DashHeaderOG";
import { ConvexDataProvider } from "@/lib/data/convex";
import { CellComponentData } from "@/components/dashboard/table/cellComponent";
import TaskModule from "@/components/dashboard/taskModule/taskModule";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api"; // Generated Convex API via path alias
import { TaskCardData } from "@/components/taskcard";
import NextUpSection from "@/components/dashboard/NextUpSection"; // NEW: Add import

const dataProvider = new ConvexDataProvider();

export default function DashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  // All hooks first: Consistent order every render
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [queueData, setQueueData] = useState<Record<
    string,
    QueueSnapshot
  > | null>(null);
  const [dashboardOverview, setDashboardOverview] =
    useState<DashboardOverview | null>(null);
  const [tableData, setTableData] = useState<CellComponentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queueSnapshot = useQuery(api.queues.getSnapshot, { creatorSlug: slug });
  const settings = useQuery(api.queues.getSettings, { creatorSlug: slug });
  const overviewLive = useQuery(api.dashboard.getOverview, {
    creatorSlug: slug,
  });
  const toggleQueue = useMutation(api.queues.toggleEnabled);
  const updateSettings = useMutation(api.queues.updateSettings);
  const recomputeWorkflowTags = useMutation(
    api.tickets.recomputeWorkflowTagsForCreator
  );
  const [personalEnabled, setPersonalEnabled] = useState(false);
  const [priorityEnabled, setPriorityEnabled] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null);
  const positions = useQuery(api.dashboard.getAllTicketsWithPositions, {
    creatorSlug: slug,
  });

  useEffect(() => {
    console.log("DEBUG engine positions", positions);
    // Log detailed info about awaiting-feedback tickets
    const awaitingTickets = positions?.filter(p => p.tag === "awaiting-feedback");
    if (awaitingTickets?.length > 0) {
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for mobile sidebar
  const [isModalOpen, setIsModalOpen] = useState(false); // NEW: Modal visibility, tied to selectedTask
  const [isDesktop, setIsDesktop] = useState(false); // NEW: Track desktop breakpoint

  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "active";

  // Ensure a Convex creator exists for this slug when a signed-in user visits the dashboard
  const upsertCreator = useMutation(api.creators.upsertBySlug);

  useEffect(() => {
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
      minPriorityTipCents: 0,
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
        { href: "/skills", label: "My Skills" },
      ],
    },
  ];

  useEffect(() => {
    if (queueSnapshot) {
      setPersonalEnabled(queueSnapshot.personal.enabled);
      setPriorityEnabled(queueSnapshot.priority.enabled);
    }
  }, [queueSnapshot]);

  // useEffect: Always called, but guard inside
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Always exit loading state first (even on unauth)
      setLoading(false);

      // Skip fetch if not signed in
      if (!isSignedIn) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch queue snapshot and dashboard overview in parallel
        const [queueSnapshot, overview, tableTickets] = await Promise.all([
          dataProvider.getQueueSnapshot(slug),
          dataProvider.getDashboardOverview(slug),
          dataProvider.getAllTicketsForTable(slug),
        ]);

        setQueueData(queueSnapshot);
        setDashboardOverview(overview);
        setTableData(tableTickets);

        // Ensure workflow tags (current / next-up) are persisted based on latest data.
        try {
          await recomputeWorkflowTags({ creatorSlug: slug });
        } catch (err) {
          console.error(
            "Failed to recompute workflow tags on dashboard load",
            err
          );
        }

        // Debug: Log tableData to verify structure
        console.log("🔍 TableComponent Debug - tableTickets:", tableTickets);
        console.log(
          "🔍 TableComponent Debug - tableTickets length:",
          tableTickets?.length
        );
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        // Set empty data to prevent crashes
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [slug, isSignedIn]); // Re-run on auth change

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
  // Combined loading (Clerk + app)
  if (!isLoaded || loading) {
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

  // Unauth: redirect to Clerk sign-in with return URL
  if (!isSignedIn) {
    const redirectUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : `/${slug}/dashboard`;

    router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
    return null;
  }

  const handleTicketUpdate = async (updatedTicket: Ticket) => {
    if (!dashboardOverview) return;

    // Refresh queue data and full ticket data after approval
    try {
      const [queueSnapshot, overview, tableTickets] = await Promise.all([
        dataProvider.getQueueSnapshot(slug),
        dataProvider.getDashboardOverview(slug),
        dataProvider.getAllTicketsForTable(slug),
      ]);

      setQueueData(queueSnapshot);
      setDashboardOverview(overview);
      setTableData(tableTickets);
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
      // Set empty data to prevent crashes
      setTableData([]);
    }
  };

  // UPDATED: Enhanced handleOpenTicket for table row clicks
  const handleOpenTicket = async (ref: string) => {
    console.log("🔍 handleOpenTicket called with ref:", ref);

    try {
      if (!queueData || !dashboardOverview) {
        console.warn("Cannot open ticket: Missing queue or overview data");
        console.log("🔍 queueData:", queueData ? "exists" : "null");
        console.log(
          "🔍 dashboardOverview:",
          dashboardOverview ? "exists" : "null"
        );
        return;
      }

      const ticket = await dataProvider.getTicketByRef(ref);
      console.log("🔍 Fetched ticket:", ticket);
      if (!ticket) {
        console.warn(`Ticket not found for ref: ${ref}`);
        return;
      }

      const queueKind = ticket.queueKind as "personal" | "priority";
      const queue = queueData[queueKind];
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
          const sortedAll = sortTicketsByPriorityRatio(
            dashboardOverview.approvedTickets.filter(
              (t) => t.queueKind === "personal" || t.queueKind === "priority"
            )
          );
          const idx = sortedAll.findIndex((t) => t.ref === ticket.ref);
          if (idx === 0) computedStatus = "current";
          else if (idx === 1) computedStatus = "next-up";
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
        etaMins: queue.etaMins,
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

  // Helper function to sort tickets with 3:1 priority-to-personal ratio
  const sortTicketsByPriorityRatio = (tickets: Ticket[]) => {
    // Separate tickets by type
    const priorityTickets = tickets
      .filter((t) => t.queueKind === "priority")
      .sort((a, b) => a.createdAt - b.createdAt); // Oldest first within priority

    const personalTickets = tickets
      .filter((t) => t.queueKind === "personal")
      .sort((a, b) => a.createdAt - b.createdAt); // Oldest first within personal

    // Interleave with 3:1 ratio (3 priority : 1 personal)
    const result = [];
    let priorityIndex = 0;
    let personalIndex = 0;

    while (
      priorityIndex < priorityTickets.length ||
      personalIndex < personalTickets.length
    ) {
      // Add up to 3 priority tickets
      for (let i = 0; i < 3 && priorityIndex < priorityTickets.length; i++) {
        result.push(priorityTickets[priorityIndex]);
        priorityIndex++;
      }

      // Add 1 personal ticket if available
      if (personalIndex < personalTickets.length) {
        result.push(personalTickets[personalIndex]);
        personalIndex++;
      }
    }

    return result;
  };

  const overview = overviewLive ?? dashboardOverview;

  // Build lookup map from tickets by ref using latest overview
  const ticketByRef: Record<string, Ticket> = {};
  if (overview) {
    [...overview.openTickets, ...overview.approvedTickets].forEach((t) => {
      ticketByRef[t.ref] = t;
    });
  }

  // Helper to map engine positions + ticket docs into CellComponentData
  const mapPositionsToCellData = (
    posList: any[] | null | undefined
  ): CellComponentData[] => {
    if (!posList || !overview) return [];

    return posList.map((p) => {
      const t = ticketByRef[p.ref];
      const status =
        (t?.status as CellComponentData["status"]) ?? p.status ?? "open";
      const isNumbered = status === "approved" || status === "closed";

      const generalNumber = isNumbered ? p.ticketNumber ?? null : null;
      const ticketNumber = isNumbered
        ? p.queueNumber ?? p.ticketNumber ?? null
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
      };
    });
  };

  // For PAST/ALL we now prefer engine positions for the table
  const tableRowsForPastAll: CellComponentData[] =
    tab === "past" || tab === "all"
      ? mapPositionsToCellData(positions)
      : tableData;

  // For ACTIVE, use engine positions only so we see canonical ordering/numbers
  const tableRowsForActive: CellComponentData[] = mapPositionsToCellData(positions);

  // Show error state
  if (error || !queueData || !overview) {
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
            <p className="text-gray-600 mb-4">
              {error || "Failed to load data"}
            </p>
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

  const queues = queueData;

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

  // Build TaskCardData list for NextUpSection with awaiting-feedback tickets at top
  const approvedPositions = enginePositions.filter((p) => p.status === "approved");
  
  // Separate tickets into groups for prioritized ordering
  const awaitingTickets = approvedPositions.filter((p) => p.tag === "awaiting-feedback");
  const currentTicket = approvedPositions.find((p) => p.tag === "current");
  const otherTickets = approvedPositions.filter((p) => 
    p.tag !== "awaiting-feedback" && p.tag !== "current"
  );
  
  // Combine in desired order: awaiting-feedback first, then current, then others
  const orderedPositions = [
    ...awaitingTickets,    // Top: awaiting-feedback tickets (need attention)
    ...(currentTicket ? [currentTicket] : []), // Then: current ticket being worked on
    ...otherTickets         // Bottom: all other active tickets
  ];
  
  // Debug: Log the reordering
  console.log("DEBUG ticket reordering:", {
    original: approvedPositions.map(p => ({ ref: p.ref, tag: p.tag })),
    awaiting: awaitingTickets.map(p => ({ ref: p.ref, tag: p.tag })),
    current: currentTicket ? { ref: currentTicket.ref, tag: currentTicket.tag } : null,
    others: otherTickets.map(p => ({ ref: p.ref, tag: p.tag })),
    final: orderedPositions.map(p => ({ ref: p.ref, tag: p.tag }))
  });
  
  // Debug: Log the reordering

  

  
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
      etaMins: queues?.general?.etaMins ?? null,
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
      status: (p.tag as any) || "pending",
      tags: p.tag ? [p.tag as any] : (t?.tags as any) || [],
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
          etaMins: queues?.general?.etaMins ?? null,
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
  const hasPendingApprovals = overview?.openTickets?.length > 0;
  // autoqueue current card removed; NEXT UP is driven purely by engine positions

  return (
    <>
      <div
        id="DASHBOARD-LAYOUT"
        className="grid grid-cols-[0px_1fr] md:grid-cols-[250px_1fr] grid-rows-[auto_1fr] h-screen overflow-hidden overflow-x-visible bg-bg p-8" // Updated grid for mobile (0px sidebar col)
      >
        {/* Header - spans full width */}
        <DashHeaderOG
          onMenuClick={() => setIsSidebarOpen(true)}
          isOpen={isSidebarOpen}
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
          className="flex md:w-full w-[calc(100svw-4rem)] flex-col md:col-start-2 md:row-start-2 md:overflow-hidden md:grid gap-4 md:p-4 md:h-[86svh] h-full md:overflow-y-hidden overflow-y-auto"
        >
          {tab === "queue-settings" ? (
            <div className="col-span-2">
              <QueueSettings
                queueSnapshot={queueSnapshot}
                toggleQueue={toggleQueue}
                slug={slug}
                personalEnabled={personalEnabled}
                setPersonalEnabled={setPersonalEnabled}
                priorityEnabled={priorityEnabled}
                setPriorityEnabled={setPriorityEnabled}
              />
            </div>
          ) : tab === "past" || tab === "all" ? (
            // PAST + ALL: table view backed by engine positions
            <div className="flex flex-col w-full h-full">
              <TableComponent
                data={tableRowsForPastAll}
                onOpen={handleOpenTicket}
                activeTaskRef={selectedTask?.ref}
                enableClickToScroll={false}
                disableFocusStyling={false}
                variant={tab === "past" ? "past" : "all"}
              />
            </div>
          ) : (
            <div
              className={`flex flex-col w-full no-scrollbar md:grid gap-4 h-full md:h-[86svh] ${
                hasPendingApprovals
                  ? "w-full md:grid-cols-[400px_1fr]"
                  : "w-full md:grid-cols-[400px_1fr]"
              }`}
            >
              <NextUpSection
                approvedTaskCards={approvedTaskCards}
                activeTaskRef={selectedTask?.ref}
                onOpen={(data) => {
                  setSelectedTask(data);
                  if (!isDesktop) {
                    setIsModalOpen(true);
                  }
                }}
                hasPendingApprovals={hasPendingApprovals}
                openTickets={overview?.openTickets || []}
                onTicketUpdate={handleTicketUpdate}
              />

              <div className="flex flex-col h-full gap-4">
                {(selectedTask || autoqueueCardData) && (
                  <div data-element="TASK-MODULE" className="hidden md:block">
                    <TaskModule
                      data={selectedTask || autoqueueCardData}
                      onMarkAsFinished={async () => {
                        try {
                          const [queueSnapshot, overview, tableTickets] =
                            await Promise.all([
                              dataProvider.getQueueSnapshot(slug),
                              dataProvider.getDashboardOverview(slug),
                              dataProvider.getAllTicketsForTable(slug),
                            ]);

                          setQueueData(queueSnapshot);
                          setDashboardOverview(overview);
                          setTableData(tableTickets);
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
                          setTableData([]);
                        }
                      }}
                    />
                  </div>
                )}

                <div
                  data-element="FAVORS-TABLE"
                  className="md:h-1/2 h-full overflow-y-auto"
                >
                  <TableComponent
                    data={tableRowsForActive}
                    onOpen={handleOpenTicket}
                    activeTaskRef={selectedTask?.ref}
                    enableClickToScroll={true}
                    clickToScrollBreakpoint="desktop"
                    disableFocusStyling={true}
                    variant="active"
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
      {isModalOpen && selectedTask && (tab === "past" || tab === "all") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={`Detailed view for ticket ${selectedTask.ref}`}
        >
          <div
            className="bg-bg shadow-xl max-w-full max-h-[95vh] overflow-hidden relative w-full md:max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 z-10 text-gray-subtle hover:text-text transition-colors text-3xl font-bold p-1"
              aria-label="Close detailed view"
            >
              ×
            </button>

            <div className="p-4 h-full overflow-y-auto">
              <TaskModule
                data={selectedTask}
                isModal={true}
                className=""
                onSendForFeedback={() => {
                  closeModal();
                }}
                onMarkAsFinished={async () => {
                  try {
                    const [queueSnapshot, overview, tableTickets] =
                      await Promise.all([
                        dataProvider.getQueueSnapshot(slug),
                        dataProvider.getDashboardOverview(slug),
                        dataProvider.getAllTicketsForTable(slug),
                      ]);

                    setQueueData(queueSnapshot);
                    setDashboardOverview(overview);
                    setTableData(tableTickets);
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
                    setTableData([]);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
