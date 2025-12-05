"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import TaskCard, { type TaskCardData } from "@/components/taskcard";
import ApprovalPanel from "@/components/dashboard/approvalPanel"; // Import for Pending
import { type Ticket, type QueueSnapshot } from "@/lib/types"; // For tickets prop
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ResizableDivider } from "@/components/dashboard/ResizableDivider";

// Register GSAP plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface NextUpSectionProps {
  approvedTaskCards: TaskCardData[];
  activeTaskRef?: string; // Track which task is currently active in TaskModule
  onOpen: (data: TaskCardData) => void;
  hasPendingApprovals: boolean;
  openTickets: Ticket[]; // NEW: Pass for ApprovalPanel
  onTicketUpdate: (updatedTicket: Ticket) => Promise<void>; // NEW: Pass handler
  queueSnapshot: QueueSnapshot;
}

export default function NextUpSection({
  approvedTaskCards,
  activeTaskRef,
  onOpen,
  hasPendingApprovals,
  openTickets,
  onTicketUpdate,
  queueSnapshot,
}: NextUpSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false); // Default expanded
  const [isPendingCollapsed, setIsPendingCollapsed] = useState(false); // Default expanded for Pending Approvals
  const [splitPercentage, setSplitPercentage] = useState(50); // For resizable divider (50/50 default)
  const [isDesktop, setIsDesktop] = useState(false); // Track desktop breakpoint

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const togglePendingCollapse = () =>
    setIsPendingCollapsed(!isPendingCollapsed);

  // Create refs for each task card
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  // Track last active card to avoid redundant onOpen calls
  const lastActiveRef = useRef<string | null>(null);

  // Combine all task cards for ScrollTrigger
  const allTaskCards = useMemo(
    () => [...approvedTaskCards],
    [approvedTaskCards]
  );

  // Note: scrollContainerRef is managed via ref; no debug side effects here.

  // Detect desktop breakpoint for conditional rendering
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

  // GSAP ScrollTrigger setup (desktop only)
  useEffect(() => {
    // Only run on desktop
    if (!isDesktop || isCollapsed || !scrollContainerRef.current) return;

    const triggers: ScrollTrigger[] = [];
    const scrollContainer = scrollContainerRef.current;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Create ScrollTrigger for each card
      cardRefs.current.forEach((cardElement, index) => {
        const card = allTaskCards[index];
        if (!cardElement || !card) return;

        const trigger = ScrollTrigger.create({
          trigger: cardElement,
          scroller: scrollContainer, // Track this container's scroll, not window
          start: "top 45%", // When card's top hits 50% of container
          end: "bottom 55%", // When card's bottom leaves 50% of container
          onEnter: () => {
            if (lastActiveRef.current === card.ref) return;
            lastActiveRef.current = card.ref;
            onOpen(card);
          },
          onEnterBack: () => {
            if (lastActiveRef.current === card.ref) return;
            lastActiveRef.current = card.ref;
            onOpen(card);
          },
          markers: false,
        });

        triggers.push(trigger);
      });

      // Recalculate positions after all triggers are created
      ScrollTrigger.refresh();
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      triggers.forEach((trigger) => trigger.kill());
    };
  }, [isDesktop, isCollapsed, hasPendingApprovals]); // Re-run when layout changes, not when callbacks change

  return (
    <div
      data-element="NEXT-UP-COLUMN"
      className="flex flex-col md:h-[86svh] w-full "
    >
      {/* DESKTOP LAYOUT: Resizable divider between sections */}
      {isDesktop && hasPendingApprovals ? (
        <>
          {/* Pending Approvals Section - Desktop */}
          <div
            data-element="PENDING-APPROVALS-SECTION-DESKTOP"
            className="flex flex-col overflow-hidden"
            style={{ height: `${splitPercentage}%` }}
          >
            <div className="flex items-center justify-between w-full border-b border-gray-subtle pb-2 sticky top-0 bg-bg">
              <h2 className="text-xl font-bold bg-bg w-full">
                PENDING REQUESTS
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar  min-h-0">
              <ApprovalPanel
                tickets={openTickets}
                onTicketUpdate={onTicketUpdate}
                queueSnapshot={queueSnapshot}
              />
            </div>
          </div>

          {/* Resizable Divider - Desktop only */}
          <ResizableDivider onResize={setSplitPercentage} />

          {/* Next Up Section - Desktop */}
          <div
            data-element="NEXT-UP-SECTION-DESKTOP"
            className="flex flex-col overflow-hidden"
            style={{ height: `${100 - splitPercentage}%` }}
          >
            <div className="flex items-center justify-between w-full border-b border-gray-subtle pb-2 sticky top-0 bg-bg">
              <h2 className="md:text-xl font-bold bg-bg w-full">NEXT UP</h2>
            </div>
            <div
              ref={(el) => {
                scrollContainerRef.current = el;
              }}
              data-element="NEXT-UP-SCROLL-CONTAINER"
              className="flex-1 overflow-y-auto overflow-x-visible no-scrollbar px-4 min-h-0"
            >
              <div data-element="TASK-CARDS-WRAPPER" className="flex-1">
                <div className="flex flex-col  gap-4 pb-[50vh] mt-3">
                  {/* Approved ticket cards */}
                  {approvedTaskCards.length > 0 ? (
                    approvedTaskCards.map((taskCardData, index) => {
                      return (
                        <div
                          key={taskCardData.ref}
                          data-task-ref={taskCardData.ref}
                        >
                          <TaskCard
                            ref={(el) => {
                              cardRefs.current[index] = el;
                            }}
                            variant={
                              taskCardData.queueKind === "priority"
                                ? "priority"
                                : "personal"
                            }
                            data={taskCardData}
                            isActive={taskCardData.ref === activeTaskRef}
                            onOpen={onOpen}
                            forceExpanded={true}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No approved tickets in processing queue</p>
                      <p className="text-sm mt-2">
                        Approve tickets to see them here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* MOBILE/NON-DESKTOP LAYOUT: Collapse/expand with single scroll */
        <>
          {/* Pending Approvals - Mobile with collapse/expand */}
          {hasPendingApprovals && (
            <>
              <button
                onClick={togglePendingCollapse}
                className="flex items-center justify-between w-full text-left border-b border-gray-subtle pb-2 sticky top-0 bg-bg md:hidden"
                aria-expanded={!isPendingCollapsed}
              >
                <h2 className="text-md font-bold bg-bg w-full">
                  PENDING REQUESTS
                </h2>
                <span
                  className={`text-xs text-gray-subtle transition-transform duration-300 ${isPendingCollapsed ? "rotate-180" : ""}`}
                >
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${isPendingCollapsed ? "max-h-0" : "max-h-[66vh]"}`}
              >
                <div
                  data-element="PENDING-APPROVALS-COLUMN"
                  className="h-full mb-8"
                >
                  <ApprovalPanel
                    tickets={openTickets}
                    onTicketUpdate={onTicketUpdate}
                    queueSnapshot={queueSnapshot}
                  />
                </div>
              </div>
            </>
          )}

          {/* Next Up - Mobile with collapse/expand */}
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-between w-full text-left border-b border-gray-subtle py-2 sticky top-0 bg-bg md:hidden"
            aria-expanded={!isCollapsed}
          >
            <h2 className="text-md font-bold bg-bg w-full">NEXT UP</h2>
            <span
              className={`text-xs text-gray-subtle transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>
          <div
            className={`overflow-x-auto md:overflow-y-auto md:overflow-x-visible no-scrollbar transition-all duration-300 ease-in-out md:px-4 ${isCollapsed ? "max-h-0" : "max-h-[80vh]"} scroll-pb-6 md:hidden`}
          >
            <div
              data-element="TASK-CARDS-WRAPPER"
              className="md:flex-1 px-1 md:px-0"
            >
              <div className="flex flex-col md:flex-col md:gap-4 gap-4 md:pl-0 md:pr-0 md:px-0 pb-4 md:pb-[50vh] mt-3">
                {/* Approved ticket cards */}
                {approvedTaskCards.length > 0 ? (
                  approvedTaskCards.map((taskCardData, index) => {
                    return (
                      <div
                        key={taskCardData.ref}
                        data-task-ref={taskCardData.ref}
                      >
                        <TaskCard
                          ref={(el) => {
                            cardRefs.current[index] = el;
                          }}
                          variant={
                            taskCardData.queueKind === "priority"
                              ? "priority"
                              : "personal"
                          }
                          data={taskCardData}
                          isActive={taskCardData.ref === activeTaskRef}
                          onOpen={onOpen}
                          forceExpanded={true}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No approved tickets in processing queue</p>
                    <p className="text-sm mt-2">
                      Approve tickets to see them here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop without pending approvals - show only NEXT UP */}
          {isDesktop && !hasPendingApprovals && (
            <>
              <div className="flex items-center justify-between w-full border-b border-gray-subtle pb-2 sticky top-0 bg-bg">
                <h2 className="md:text-xl font-bold bg-bg w-full">NEXT UP</h2>
              </div>
              <div
                ref={(el) => {
                  scrollContainerRef.current = el;
                }}
                data-element="NEXT-UP-SCROLL-CONTAINER"
                className="flex-1 overflow-y-auto overflow-x-visible no-scrollbar px-4 min-h-0"
              >
                <div data-element="TASK-CARDS-WRAPPER" className="flex-1">
                  <div className="flex flex-col gap-4 pb-[50vh] mt-3">
                    {/* Approved ticket cards */}
                    {approvedTaskCards.length > 0 ? (
                      approvedTaskCards.map((taskCardData, index) => {
                        return (
                          <div
                            key={taskCardData.ref}
                            data-task-ref={taskCardData.ref}
                          >
                            <TaskCard
                              ref={(el) => {
                                cardRefs.current[index] = el;
                              }}
                              variant={
                                taskCardData.queueKind === "priority"
                                  ? "priority"
                                  : "personal"
                              }
                              data={taskCardData}
                              isActive={taskCardData.ref === activeTaskRef}
                              onOpen={onOpen}
                              forceExpanded={true}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No approved tickets in processing queue</p>
                        <p className="text-sm mt-2">
                          Approve tickets to see them here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
