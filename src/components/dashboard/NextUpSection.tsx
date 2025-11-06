"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import TaskCard, {
  type TaskCardData,
  type TaskCardVariant,
} from "@/components/taskcard";
import ApprovalPanel from "@/components/dashboard/approvalPanel"; // Import for Pending
import { type Ticket } from "@/lib/types"; // For tickets prop
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface NextUpSectionProps {
  autoqueueCardData: TaskCardData | null;
  approvedTaskCards: TaskCardData[];
  activeTaskRef?: string; // Track which task is currently active in TaskModule
  onOpen: (data: TaskCardData) => void;
  hasPendingApprovals: boolean;
  openTickets: Ticket[]; // NEW: Pass for ApprovalPanel
  onTicketUpdate: (updatedTicket: Ticket) => Promise<void>; // NEW: Pass handler
}

export default function NextUpSection({
  autoqueueCardData,
  approvedTaskCards,
  activeTaskRef,
  onOpen,
  hasPendingApprovals,
  openTickets,
  onTicketUpdate,
}: NextUpSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false); // Default expanded

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Create refs for each task card
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Combine all task cards for ScrollTrigger
  const allTaskCards = useMemo(() => {
    const cards = [];
    if (autoqueueCardData) {
      cards.push(autoqueueCardData);
    }
    cards.push(...approvedTaskCards);
    return cards;
  }, [
    autoqueueCardData?.ref,
    approvedTaskCards.map((card) => card.ref).join(","),
  ]);

  // Debug: Monitor scroll container ref changes
  useEffect(() => {
    console.log(
      "🔍 NextUpSection: scrollContainerRef.current changed:",
      scrollContainerRef.current
    );
    if (scrollContainerRef.current) {
      console.log(
        "🔍 NextUpSection: Container data-element:",
        scrollContainerRef.current.getAttribute("data-element")
      );
      console.log(
        "🔍 NextUpSection: Container has scrollTo method:",
        typeof scrollContainerRef.current.scrollTo
      );
    }
  }, [scrollContainerRef.current]);

  // GSAP ScrollTrigger setup (desktop only)
  useEffect(() => {
    // Only run on desktop
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop || isCollapsed || !scrollContainerRef.current) return;

    const triggers: ScrollTrigger[] = [];
    const scrollContainer = scrollContainerRef.current;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Create ScrollTrigger for each card
      cardRefs.current.forEach((cardElement, index) => {
        if (!cardElement || !allTaskCards[index]) return;

        const trigger = ScrollTrigger.create({
          trigger: cardElement,
          scroller: scrollContainer, // Track this container's scroll, not window
          start: "top 50%", // When card's top hits 50% of container
          end: "bottom 50%", // When card's bottom leaves 50% of container
          onEnter: () => {
            onOpen(allTaskCards[index]);
          },
          onEnterBack: () => {
            onOpen(allTaskCards[index]);
          },
          markers: false,
        });

        triggers.push(trigger);
      });
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      triggers.forEach((trigger) => trigger.kill());
    };
  }, [allTaskCards, onOpen, isCollapsed]); // Re-run when cards change

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
        <div data-element="PENDING-APPROVALS-COLUMN" className="h-auto mb-8">
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
        ref={(el) => {
          scrollContainerRef.current = el;
          if (el) {
            console.log("🔍 NextUpSection: Scroll container ref set:", el);
            console.log(
              "🔍 NextUpSection: Scroll container has data-element:",
              el.getAttribute("data-element")
            );
            console.log(
              "🔍 NextUpSection: Scroll container classes:",
              el.className
            );
            console.log(
              "🔍 NextUpSection: Scroll container scrollHeight:",
              el.scrollHeight
            );
            console.log(
              "🔍 NextUpSection: Scroll container clientHeight:",
              el.clientHeight
            );
          }
        }}
        className={`overflow-x-auto md:overflow-y-auto md:overflow-x-visible no-scrollbar transition-all duration-300 ease-in-out px-4 ${isCollapsed ? "max-h-0" : "max-h-[80vh]"} scroll-pb-6`}
      >
        <div data-element="TASK-CARDS-WRAPPER" className="md:flex-1">
          {/* UPDATED: Flex row - replace space-x-4 pr-6 with gap-4 + balanced pl/pr for ends + between spacing */}
          <div className="flex flex-col md:flex-col md:gap-4 gap-4  md:pl-0 md:pr-0 md:px-0 pb-4 md:pb-[50vh]">
            {/* Autoqueue summary card */}
            {autoqueueCardData && (
              <div data-task-ref={autoqueueCardData.ref}>
                {console.log(
                  "🔍 NextUpSection: Autoqueue card ref:",
                  autoqueueCardData.ref
                )}
                <TaskCard
                  ref={(el) => {
                    cardRefs.current[0] = el;
                    console.log(
                      "🔍 NextUpSection: Autoqueue card ref set:",
                      el
                    );
                  }}
                  variant="autoqueue"
                  data={autoqueueCardData}
                  isActive={autoqueueCardData.ref === activeTaskRef}
                  onOpen={onOpen}
                />
              </div>
            )}

            {/* Individual approved ticket cards */}
            {approvedTaskCards.length > 0 ? (
              approvedTaskCards.map((taskCardData, index) => {
                const refIndex = autoqueueCardData ? index + 1 : index;
                console.log(
                  "🔍 NextUpSection: Approved card ref:",
                  taskCardData.ref,
                  "index:",
                  index,
                  "refIndex:",
                  refIndex
                );
                return (
                  <div key={taskCardData.ref} data-task-ref={taskCardData.ref}>
                    <TaskCard
                      ref={(el) => {
                        cardRefs.current[refIndex] = el;
                        console.log(
                          "🔍 NextUpSection: Approved card ref set:",
                          el,
                          "for ref:",
                          taskCardData.ref
                        );
                      }}
                      variant={
                        taskCardData.queueKind === "priority"
                          ? "priority"
                          : "personal"
                      }
                      data={taskCardData}
                      isActive={taskCardData.ref === activeTaskRef}
                      onOpen={onOpen}
                    />
                  </div>
                );
              })
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
