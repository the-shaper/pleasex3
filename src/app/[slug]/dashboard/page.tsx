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
import { useUser, SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api"; // Generated Convex API via path alias
import { TaskCardData } from "@/components/taskcard";
import NextUpSection from "@/components/dashboard/NextUpSection"; // NEW: Add import

const dataProvider = new ConvexDataProvider();

export default function DashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  // All hooks first: Consistent order every render
  const { isSignedIn, isLoaded } = useUser();
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
  const overviewLive = useQuery(api.dashboard.getOverview, { creatorSlug: slug });
  const toggleQueue = useMutation(api.queues.toggleEnabled);
  const [personalEnabled, setPersonalEnabled] = useState(false);
  const [priorityEnabled, setPriorityEnabled] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null);

  // Debug: Log when selectedTask changes
  useEffect(() => {
    console.log("🔄 Dashboard: selectedTask changed to:", selectedTask?.ref || 'null');
  }, [selectedTask]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for mobile sidebar
  const [isModalOpen, setIsModalOpen] = useState(false); // NEW: Modal visibility, tied to selectedTask
  const [isDesktop, setIsDesktop] = useState(false); // NEW: Track desktop breakpoint

  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "active";

  const dashboardSections: SidebarSectionProps[] = [
    {
      title: "Favors",
      links: [
        { href: "?tab=active", label: "Active" },
        { href: "/past", label: "Past" },
        { href: "/all", label: "All" },
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

        // Debug: Log tableData to verify structure
        console.log("🔍 TableComponent Debug - tableTickets:", tableTickets);
        console.log(
          "🔍 TableComponent Debug - tableTickets length:",
          tableTickets?.length
        );
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
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

  // Unauth: Sign-in screen
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg p-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Welcome to Dashboard</h1>
          <p className="text-text-muted mb-8">
            Please sign in to access your dashboard.
          </p>
          <SignIn
            routing="hash"
            signUpUrl="/sign-up"
            afterSignInUrl={window.location.pathname} // Redirect back to this dashboard URL after sign-in
          />
        </div>
      </div>
    );
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
    }
  };

  // UPDATED: Enhanced handleOpenTicket for table row clicks
  const handleOpenTicket = async (ref: string) => {
    console.log("🔍 handleOpenTicket called with ref:", ref); // DEBUG: Entry point

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
      console.log("🔍 Fetched ticket:", ticket); // DEBUG: Ticket data
      if (!ticket) {
        console.warn(`Ticket not found for ref: ${ref}`);
        return;
      }

      // Determine queue kind and snapshot
      const queueKind = ticket.queueKind as "personal" | "priority";
      const queue = queueData[queueKind];
      console.log("🔍 Queue kind:", queueKind, "Queue data:", queue); // DEBUG: Queue info
      if (!queue) {
        console.warn(`No queue snapshot for ${queueKind}`);
        return;
      }

      // Get relevant tickets for position calculation (open or approved based on status)
      let relevantTickets: Ticket[];
      if (ticket.status === "approved") {
        relevantTickets = dashboardOverview.approvedTickets;
      } else if (ticket.status === "open") {
        relevantTickets = dashboardOverview.openTickets;
      } else {
        console.warn(
          `Ticket ${ref} is not open or approved (status: ${ticket.status})`
        );
        return;
      }
      console.log(
        "🔍 Relevant tickets length:",
        relevantTickets.length,
        "Status:",
        ticket.status
      ); // DEBUG: Tickets for position

      // Compute overall status like NextUp (3:1 priority:personal)
      let computedStatus: "current" | "next-up" | "pending" = "pending";
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

      // Sort relevant tickets chronologically within their queue kind
      const sameQueueTickets = relevantTickets
        .filter((t) => t.queueKind === queueKind)
        .sort((a, b) => a.createdAt - b.createdAt);

      // Calculate position (1-based index)
      const ticketPosition =
        sameQueueTickets.findIndex((t) => t.ref === ref) + 1;
      console.log("🔍 Calculated position:", ticketPosition); // DEBUG: Position

      // Build TaskCardData (use computedStatus like NextUp)
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
      console.log("🔍 Built TaskCardData:", taskCardData); // DEBUG: Final data
      console.log("🔍 Setting selectedTask..."); // DEBUG: Before set

      setSelectedTask(taskCardData);
      // Only open modal on mobile, desktop shows in TaskModule directly
      if (!isDesktop) {
        setIsModalOpen(true);
      }
      console.log("🔍 selectedTask set!"); // DEBUG: After set (may not log if re-render)
    } catch (err) {
      console.error("Error opening ticket:", err);
      // Fallback: Reset to autoqueue or null
      setSelectedTask(null);
    }
  };

  // NEW: Add closeModal function after existing handlers (e.g., after handleOpenTicket around line 279)
  const closeModal = () => {
    setSelectedTask(null); // Reset selection
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

  // Get the first approved ticket for the autoqueue card display
  const getFirstApprovedTicket = () => {
    const approvedTickets = overview.approvedTickets.filter(
      (ticket) =>
        ticket.queueKind === "personal" || ticket.queueKind === "priority"
    );

    if (approvedTickets.length === 0) return null;

    // Sort by 3:1 priority ratio and get the first (highest priority)
    const sortedTickets = sortTicketsByPriorityRatio(approvedTickets);

    return sortedTickets[0];
  };

  const firstApprovedTicket = getFirstApprovedTicket();

  // Check if there are pending approvals to conditionally show the column
  const hasPendingApprovals = overview?.openTickets?.length > 0;

  // Create autoqueue card data for the NEXT UP section
  // Autoqueue shows the CURRENT ticket being worked on (first approved ticket)
  // This represents the actual task the creator should focus on next
  const autoqueueCardData = firstApprovedTicket
    ? (() => {
        // Calculate position in combined chronological queue (all tickets together)
    const allApprovedTickets = overview.approvedTickets.sort(
          (a, b) => a.createdAt - b.createdAt
        );

        const ticketPosition =
          allApprovedTickets.findIndex(
            (t) => t.ref === firstApprovedTicket.ref
          ) + 1;

        return {
          currentTurn: ticketPosition,
          nextTurn: ticketPosition, // Show current position in combined queue
          etaMins: queues.general.etaMins,
          activeCount: queues.general.activeCount, // Total tickets in general queue
          enabled: queues.general.enabled,
          name: firstApprovedTicket.name || "Anonymous",
          email: firstApprovedTicket.email || "user@example.com",
          phone: firstApprovedTicket.phone || "",
          location: firstApprovedTicket.location || "",
          social: firstApprovedTicket.social || "",
          needText: firstApprovedTicket.taskTitle || "No description provided",
          message: firstApprovedTicket.message || "No description provided", // Converted to message
          attachments: firstApprovedTicket.attachments || [],
          tipCents: firstApprovedTicket.tipCents,
          queueKind: firstApprovedTicket.queueKind as "personal" | "priority",
          // Prefer DB tags; fallback to current
          status: ((firstApprovedTicket.tags && (firstApprovedTicket.tags as any[]).length
            ? (firstApprovedTicket.tags as any[])[0]
            : "current") as TaskCardData["status"]),
          tags: ((firstApprovedTicket.tags && (firstApprovedTicket.tags as any[]).length
            ? (firstApprovedTicket.tags as any[])
            : ["current"]) as TaskTag[]),
          createdAt: firstApprovedTicket.createdAt,
          ref: firstApprovedTicket.ref,
        };
      })()
    : null;

  // Create individual cards for approved tickets (next up)
  const approvedTaskCards = sortTicketsByPriorityRatio(
    overview.approvedTickets.filter(
      (ticket) =>
        ticket.queueKind === "personal" || ticket.queueKind === "priority"
    )
  ).map((ticket, index) => {
    let status: "current" | "next-up" | "pending" = "pending";
    if (index === 0) {
      status = "current"; // First ticket is current
    } else if (index === 1) {
      status = "next-up"; // Second ticket is next-up
    }
    // All others are pending

    // Use actual ticket data now that it's stored in the database
    const userData = {
      name: ticket.name || "Anonymous",
      email: ticket.email || "user@example.com",
      location: ticket.location || "",
      social: ticket.social || "",
      phone: ticket.phone || "",
    };

    // Use queue-specific metrics based on ticket's queue kind
    const ticketQueue = queues[ticket.queueKind as "personal" | "priority"];

    // Calculate this ticket's position within its queue
    const ticketsInSameQueue = overview.approvedTickets
      .filter((t) => t.queueKind === ticket.queueKind)
      .sort((a, b) => a.createdAt - b.createdAt);

    const ticketPosition =
      ticketsInSameQueue.findIndex((t) => t.ref === ticket.ref) + 1;

    return {
      currentTurn: ticketPosition, // Show this ticket's position
      nextTurn: ticketPosition, // Use same number for display
      etaMins: ticketQueue.etaMins,
      activeCount: ticketQueue.activeCount, // Total in this queue type
      enabled: ticketQueue.enabled,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      location: userData.location,
      social: userData.social,
      needText: ticket.taskTitle || "No description provided",
      message: ticket.message || "No description provided", // "Need" converted to message
      attachments: ticket.attachments || [],
      tipCents: ticket.tipCents,
      queueKind: ticket.queueKind as "personal" | "priority",
      status: ((ticket.tags && (ticket.tags as any[]).length
        ? (ticket.tags as any[])[0]
        : status) as TaskCardData["status"]),
      tags: ((ticket.tags && (ticket.tags as any[]).length
        ? (ticket.tags as any[])
        : [status]) as TaskTag[]),
      createdAt: ticket.createdAt,
      ref: ticket.ref,
    };
  });

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

        {/* Sidebar */}
        <div
          data-element="SIDEBAR-WRAPPER"
          className="col-start-1 row-start-2 overflow-y-auto pt-4" // Removed hidden md:block - SideBar handles visibility
        >
          <SideBar
            sections={dashboardSections}
            currentTab={tab}
            mobileOverlay={true}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>

        {/* Main Content Area */}
        <div
          data-element="MAIN-CONTENT-WRAPPER"
          className="flex md:w-full w-[calc(100svw-4rem)] flex-col md:col-start-2 md:row-start-2 md:overflow-hidden md:grid gap-4 md:p-4 md:h-[86svh] h-full md:overflow-y-hidden overflow-y-auto" // UPDATED: Removed 'relative' as MenuButton is moved
        >
          {tab === "queue-settings" ? (
            <div className="col-span-2">
              {" "}
              {/* Assuming 2 cols for sidebar + main; adjust if more */}
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
          ) : (
            <div
              className={`flex flex-col w-full  no-scrollbar md:grid gap-4 h-full md:h-[86svh] ${
                hasPendingApprovals
                  ? "w-full md:grid-cols-[400px_1fr]"
                  : "w-full md:grid-cols-[400px_1fr]"
              }`}
            >
              {/* UPDATED: Use NextUpSection wrapper - replaces entire Next Up + Pending column */}
              <NextUpSection
                autoqueueCardData={autoqueueCardData}
                approvedTaskCards={approvedTaskCards}
                activeTaskRef={selectedTask?.ref || autoqueueCardData?.ref}
                onOpen={(data) => {
                  setSelectedTask(data);
                  // Only open modal on mobile, desktop shows in TaskModule directly
                  if (!isDesktop) {
                    setIsModalOpen(true);
                  }
                }}
                hasPendingApprovals={hasPendingApprovals}
                openTickets={overview?.openTickets || []}
                onTicketUpdate={handleTicketUpdate}
              />

              {/* Right Column: Unchanged structure, but remove any manual h2 for ALL FAVORS */}
              <div className="flex flex-col h-full gap-4">
                {/* Task Module */}
                <div data-element="TASK-MODULE" className="hidden md:block">
                  {" "}
                  {/* NEW: hidden md:block */}
                  <TaskModule data={selectedTask || autoqueueCardData} />
                </div>

                {/* Favors Table - No h2 here, as it's now in TableComponent */}
                <div
                  data-element="FAVORS-TABLE"
                  className="md:h-1/2 h-full overflow-y-auto"
                >
                  <TableComponent
                    data={tableData}
                    onOpen={handleOpenTicket}
                    currentTurn={autoqueueCardData?.currentTurn}
                    activeTaskRef={selectedTask?.ref || autoqueueCardData?.ref}
                    enableClickToScroll={true}
                    clickToScrollBreakpoint="desktop"
                    disableFocusStyling={true}
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

      {/* NEW: Mobile-only TaskModule modal */}
      {isModalOpen && selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm md:hidden" // Mobile-only, semi-transparent backdrop
          onClick={closeModal} // Close on outside click
          role="dialog"
          aria-modal="true"
          aria-label={`Detailed view for ticket ${selectedTask.ref}`}
        >
          <div
            className="bg-bg shadow-xl max-w-full max-h-[95vh] overflow-hidden relative w-full" // Responsive: full-width, near-full height
            onClick={(e) => e.stopPropagation()} // Prevent close on content interaction
          >
            {/* Close button - top-right, accessible */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 z-10 text-gray-subtle hover:text-text transition-colors text-3xl font-bold p-1"
              aria-label="Close detailed view"
            >
              ×
            </button>

            {/* Render TaskModule - passes className for padding; internals unchanged */}
            <div className="p-4 h-full overflow-y-auto">
              {" "}
              {/* Wrapper for scroll + padding */}
              <TaskModule
                data={selectedTask}
                className="" // No extra className - let internals handle (e.g., flex-col on mobile)
                isModal={true} // NEW: Hide chevron in modal
                onSendForFeedback={() => {
                  // OPTIONAL: Handle "Ongoing" action (e.g., update status, refresh data)
                  // For now, just close - expand as needed
                  closeModal();
                }}
                onMarkAsFinished={() => {
                  // OPTIONAL: Handle "Finished" action (e.g., mark done, notify)
                  closeModal();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
