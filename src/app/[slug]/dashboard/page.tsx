"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SideBar } from "@/components/sidebar/sideBar";
import { TableComponent } from "@/components/dashboard/table/tableComponent";
import TaskCard from "@/components/taskcard";
import ApprovalPanel from "@/components/checkout/approvalPanel";
import { TaskTag, QueueSnapshot, DashboardOverview, Ticket } from "@/lib/types";
import DashHeaderOG from "@/components/dashboard/DashHeaderOG";
import { ConvexDataProvider } from "@/lib/data/convex";

const dataProvider = new ConvexDataProvider();

export default function DashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [queueData, setQueueData] = useState<Record<
    string,
    QueueSnapshot
  > | null>(null);
  const [dashboardOverview, setDashboardOverview] =
    useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleTicketUpdate = async (updatedTicket: Ticket) => {
    if (!dashboardOverview) return;

    // Refresh queue data and full ticket data after approval
    try {
      const [queueSnapshot, overview] = await Promise.all([
        dataProvider.getQueueSnapshot(slug),
        dataProvider.getDashboardOverview(slug),
      ]);

      setQueueData(queueSnapshot);
      setDashboardOverview(overview);
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch queue snapshot and dashboard overview in parallel
        const [queueSnapshot, overview] = await Promise.all([
          dataProvider.getQueueSnapshot(slug),
          dataProvider.getDashboardOverview(slug),
        ]);

        setQueueData(queueSnapshot);
        setDashboardOverview(overview);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div
        id="DASHBOARD-LAYOUT"
        className="grid grid-cols-[250px_1fr] grid-rows-[auto_1fr] h-screen overflow-hidden bg-bg p-8"
      >
        <DashHeaderOG />
        <div className="col-start-2 row-start-2 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Loading dashboard...</h2>
            <p className="text-gray-600">
              Fetching latest queue and ticket data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !queueData || !dashboardOverview) {
    return (
      <div
        id="DASHBOARD-LAYOUT"
        className="grid grid-cols-[250px_1fr] grid-rows-[auto_1fr] h-screen overflow-hidden bg-bg p-8"
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
    const approvedTickets = dashboardOverview.approvedTickets.filter(
      (ticket) =>
        ticket.queueKind === "personal" || ticket.queueKind === "priority"
    );

    if (approvedTickets.length === 0) return null;

    // Sort by creation time and get the first (oldest/current)
    const sortedTickets = [...approvedTickets].sort(
      (a, b) => a.createdAt - b.createdAt
    );

    return sortedTickets[0];
  };

  const firstApprovedTicket = getFirstApprovedTicket();

  // Check if there are pending approvals to conditionally show the column
  const hasPendingApprovals = dashboardOverview?.openTickets?.length > 0;

  // Create autoqueue card data for the NEXT UP section
  // Create autoqueue card data for the summary at the top
  const autoqueueCardData =
    dashboardOverview.approvedTickets.length > 0
      ? {
          currentTurn: queues.general.activeTurn,
          nextTurn: queues.general.nextTurn,
          etaMins: queues.general.etaMins,
          activeCount: dashboardOverview.approvedTickets.length, // Show total approved tickets
          enabled: queues.general.enabled,
          name: "Processing Queue", // Show queue info, not individual user
          email: `${dashboardOverview.approvedTickets.length} ticket${
            dashboardOverview.approvedTickets.length !== 1 ? "s" : ""
          } in queue`,
          phone: "",
          location: "",
          social: "",
          needText: "Processing approved requests",
          attachments: [],
          tipCents: 0, // Not relevant for summary card
          queueKind: "personal" as const, // Use personal for autoqueue
          status: "current" as const,
          tags: ["current"] as TaskTag[],
          createdAt: Date.now(), // Not relevant for summary card
          ref: "AUTOQUEUE-SUMMARY", // Special ref for summary card
        }
      : null;

  // Create individual cards for approved tickets (next up)
  const approvedTaskCards = dashboardOverview.approvedTickets
    .filter(
      (ticket) =>
        ticket.queueKind === "personal" || ticket.queueKind === "priority"
    )
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((ticket, index) => {
      let status: "current" | "next-up" | "pending" = "pending";
      if (index === 0) {
        status = "current"; // First ticket is current
      } else if (index === 1) {
        status = "next-up"; // Second ticket is next-up
      }
      // All others are pending

      // Use placeholder data for user details since they're not stored in tickets yet
      const placeholderUsers = [
        {
          name: "Alex Chen",
          email: "alex@example.com",
          location: "San Francisco, CA",
          social: "@alexdev",
        },
        {
          name: "Sarah Johnson",
          email: "sarah@example.com",
          location: "New York, NY",
          social: "@sarahj",
        },
        {
          name: "Mike Rodriguez",
          email: "mike@example.com",
          location: "Austin, TX",
          social: "@miketech",
        },
        {
          name: "Emma Wilson",
          email: "emma@example.com",
          location: "Seattle, WA",
          social: "@emmaw",
        },
        {
          name: "David Kim",
          email: "david@example.com",
          location: "Los Angeles, CA",
          social: "@davidk",
        },
      ];

      const userData = placeholderUsers[index % placeholderUsers.length];

      return {
        currentTurn: queues.general.activeTurn,
        nextTurn: queues.general.nextTurn,
        etaMins: queues.general.etaMins,
        activeCount: queues.general.activeCount,
        enabled: queues.general.enabled,
        name: userData.name,
        email: userData.email,
        phone: "+1 (555) 123-4567",
        location: userData.location,
        social: userData.social,
        needText: ticket.message || "No description provided",
        attachments: [], // Not implemented yet
        tipCents: ticket.tipCents,
        queueKind: ticket.queueKind as "personal" | "priority",
        status,
        tags: [status] as TaskTag[],
        createdAt: ticket.createdAt,
        ref: ticket.ref,
      };
    });

  return (
    <div
      id="DASHBOARD-LAYOUT"
      className="grid grid-cols-[250px_1fr] grid-rows-[auto_1fr] h-screen overflow-hidden bg-bg p-8"
    >
      {/* Header - spans full width */}
      <DashHeaderOG />

      {/* Sidebar */}
      <div
        data-element="SIDEBAR-WRAPPER"
        className="col-start-1 row-start-2 overflow-y-auto pt-4"
      >
        <SideBar />
      </div>

      {/* Main Content Area */}
      <div
        data-element="MAIN-CONTENT-WRAPPER"
        className={`col-start-2 row-start-2 overflow-hidden grid gap-4 p-4 h-full ${
          hasPendingApprovals
            ? "grid-cols-[400px_350px_1fr]"
            : "grid-cols-[400px_1fr]"
        }`}
      >
        {/* Next Up Column */}
        <div
          data-element="NEXT-UP-COLUMN"
          className="overflow-y-auto no-scrollbar flex flex-col"
        >
          <h2 className="text-xl font-bold mb-4">NEXT UP</h2>
          <div
            data-element="TASK-CARDS-WRAPPER"
            className="flex-1  pl-1 pr-2 pb-4"
          >
            <div className="space-y-4">
              {/* Autoqueue summary card */}
              {autoqueueCardData && (
                <TaskCard variant="autoqueue" data={autoqueueCardData} />
              )}

              {/* Individual approved ticket cards */}
              {approvedTaskCards.length > 0 ? (
                approvedTaskCards.map((taskCardData) => (
                  <TaskCard
                    key={taskCardData.ref}
                    variant={
                      taskCardData.queueKind === "priority"
                        ? "priority"
                        : "personal"
                    }
                    data={taskCardData}
                  />
                ))
              ) : !autoqueueCardData ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No approved tickets in processing queue</p>
                  <p className="text-sm mt-2">
                    Approve tickets to see them here
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Pending Approvals Column - conditionally rendered */}
        {hasPendingApprovals && (
          <div data-element="PENDING-APPROVALS-COLUMN" className="h-full">
            <ApprovalPanel
              tickets={dashboardOverview?.openTickets || []}
              onTicketUpdate={handleTicketUpdate}
            />
          </div>
        )}

        {/* Favors Table */}
        <div data-element="FAVORS-TABLE" className="h-full">
          <h2 className="text-xl font-bold mb-4">ALL FAVORS</h2>
          <TableComponent data={[]} />
        </div>
      </div>
    </div>
  );
}
