"use client";

import { useState } from "react";
import TaskCard, {
  type TaskCardData,
  type TaskCardVariant,
} from "@/components/taskcard";
import ApprovalPanel from "@/components/dashboard/approvalPanel"; // Import for Pending
import { type Ticket } from "@/lib/types"; // For tickets prop

interface NextUpSectionProps {
  autoqueueCardData: TaskCardData | null;
  approvedTaskCards: TaskCardData[];
  onOpen: (data: TaskCardData) => void;
  hasPendingApprovals: boolean;
  openTickets: Ticket[]; // NEW: Pass for ApprovalPanel
  onTicketUpdate: (updatedTicket: Ticket) => Promise<void>; // NEW: Pass handler
}

export default function NextUpSection({
  autoqueueCardData,
  approvedTaskCards,
  onOpen,
  hasPendingApprovals,
  openTickets,
  onTicketUpdate,
}: NextUpSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false); // Default expanded

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div
      data-element="NEXT-UP-COLUMN"
      className="flex flex-col md:h-[86svh] h-auto w-full "
    >
      {/* Pending Approvals - unchanged, conditional */}
      <h2
        className={`text-xl font-bold ${hasPendingApprovals ? "block sticky top-0 bg-bg border-b border-gray-subtle pb-2" : "hidden"}`}
      >
        PENDING APPROVALS
      </h2>

      {hasPendingApprovals && (
        <div
          data-element="PENDING-APPROVALS-COLUMN"
          className="h-auto mb-8 md:max-h-[40vh] md:overflow-y-auto no-scrollbar"
        >
          <ApprovalPanel
            tickets={openTickets}
            onTicketUpdate={onTicketUpdate}
          />
        </div>
      )}

      {/* UPDATED: Clickable NEXT UP title with chevron */}
      <button
        onClick={toggleCollapse}
        className="flex items-center justify-between w-full text-left border-b border-gray-subtle pb-2 sticky top-0 bg-bg"
        aria-expanded={!isCollapsed}
      >
        <h2 className="text-xl font-bold  bg-bg w--full ">NEXT UP</h2>
        <span
          className={`text-xs text-gray-subtle transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {/* UPDATED: Add px-4 to scrollable for inset padding around the entire horizontal scroll area */}
      <div
        className={`overflow-x-auto no-scrollbar transition-all duration-300 ease-in-out px-4 ${isCollapsed ? "max-h-0" : "max-h-[80vh]"} scroll-pb-6`}
      >
        <div data-element="TASK-CARDS-WRAPPER" className="md:flex-1 pb-4">
          {/* UPDATED: Flex row - replace space-x-4 pr-6 with gap-4 + balanced pl/pr for ends + between spacing */}
          <div className="flex flex-col md:flex-col md:gap-4 gap-4 pl-4 pr-4 md:pl-0 md:pr-0 md:px-0">
            {/* Autoqueue summary card */}
            {autoqueueCardData && (
              <TaskCard
                variant="autoqueue"
                data={autoqueueCardData}
                onOpen={onOpen}
              />
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
                  onOpen={onOpen}
                />
              ))
            ) : !autoqueueCardData ? (
              <div className="text-center py-8 text-gray-500">
                <p>No approved tickets in processing queue</p>
                <p className="text-sm mt-2">Approve tickets to see them here</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
