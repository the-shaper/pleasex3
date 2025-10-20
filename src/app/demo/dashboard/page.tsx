"use client";

import { useEffect, useState } from "react";
import { SideBar } from "@/components/sidebar/sideBar";
import { TableComponent } from "@/components/dashboard/table/tableComponent";
import TaskCard from "@/components/taskcard";
import ApprovalPanel from "@/components/checkout/approvalPanel";
import { TaskTag, QueueSnapshot, DashboardOverview, Ticket } from "@/lib/types";
import DashHeaderOG from "@/components/dashboard/DashHeaderOG";
import { ConvexDataProvider } from "@/lib/data/convex";
import { CellComponentData } from "@/components/dashboard/table/cellComponent";

const dataProvider = new ConvexDataProvider();

export default function DashboardPage() {
  const [queueData, setQueueData] = useState<Record<
    string,
    QueueSnapshot
  > | null>(null);
  const [dashboardOverview, setDashboardOverview] =
    useState<DashboardOverview | null>(null);
  const [tableData, setTableData] = useState<CellComponentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleTicketUpdate = async (updatedTicket: Ticket) => {
    if (!dashboardOverview) return;

    // Refresh queue data and full ticket data after approval
    try {
      const [queueSnapshot, overview, tableTickets] = await Promise.all([
        dataProvider.getQueueSnapshot("alejandro"),
        dataProvider.getDashboardOverview("alejandro"),
        dataProvider.getAllTicketsForTable("alejandro"),
      ]);

      setQueueData(queueSnapshot);
      setDashboardOverview(overview);
      setTableData(tableTickets);
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
    }
  };

  const handleOpenTicket = (ref: string) => {
    // For now, just log the ticket ref
    // In a full implementation, this could navigate to a ticket detail page or open a modal
    console.log("Open ticket:", ref);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch queue snapshot and dashboard overview in parallel
        const [queueSnapshot, overview, tableTickets] = await Promise.all([
          dataProvider.getQueueSnapshot("alejandro"),
          dataProvider.getDashboardOverview("alejandro"),
          dataProvider.getAllTicketsForTable("alejandro"),
        ]);

        setQueueData(queueSnapshot);
        setDashboardOverview(overview);
        setTableData(tableTickets);
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

  // Helper function to sort tickets with 3:1 priority-to-personal ratio
  const sortTicketsByPriorityRatio = (tickets: any[]) => {
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

  // Get the first approved ticket for the autoqueue card display
  const getFirstApprovedTicket = () => {
    const approvedTickets = dashboardOverview.approvedTickets.filter(
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
  const hasPendingApprovals = dashboardOverview?.openTickets?.length > 0;

  // Create autoqueue card data for the NEXT UP section
  // Autoqueue shows the CURRENT ticket being worked on (first approved ticket)
  // This represents the actual task the creator should focus on next
  const autoqueueCardData = firstApprovedTicket
    ? (() => {
        // Calculate position in combined chronological queue (all tickets together)
        const allApprovedTickets = dashboardOverview.approvedTickets.sort(
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
          needText: firstApprovedTicket.message || "No description provided",
          attachments: firstApprovedTicket.attachments || [],
          tipCents: firstApprovedTicket.tipCents,
          queueKind: firstApprovedTicket.queueKind as "personal" | "priority",
          status: "current" as const,
          tags: ["current"] as TaskTag[],
          createdAt: firstApprovedTicket.createdAt,
          ref: firstApprovedTicket.ref,
        };
      })()
    : null;

  // Create individual cards for approved tickets (next up)
  const approvedTaskCards = sortTicketsByPriorityRatio(
    dashboardOverview.approvedTickets.filter(
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
    const ticketsInSameQueue = dashboardOverview.approvedTickets
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
      needText: ticket.message || "No description provided",
      attachments: ticket.attachments || [],
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
          <TableComponent data={tableData} onOpen={handleOpenTicket} />
        </div>
      </div>
    </div>
  );
}
