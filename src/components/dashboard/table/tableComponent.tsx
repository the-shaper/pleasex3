"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { CellComponent, type CellComponentData } from "./cellComponent";

// Re-export for convenience
export type { CellComponentData };

export interface TableComponentProps {
  data: CellComponentData[];
  onOpen?: (ref: string) => void;
  className?: string;
  currentTurn?: number;
  activeTaskRef?: string; // Track active task from ScrollTrigger
  enableClickToScroll?: boolean; // NEW: Enable click-to-scroll functionality
  clickToScrollBreakpoint?: "mobile" | "desktop" | "both"; // NEW: Control when click-to-scroll is active
  disableFocusStyling?: boolean; // NEW: Disable focus styling for dashboard context
}

export function TableComponent({
  data,
  onOpen,
  className = "",
  currentTurn,
  activeTaskRef,
  enableClickToScroll = false,
  clickToScrollBreakpoint = "desktop",
  disableFocusStyling = false,
}: TableComponentProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    };

    checkMobile();
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    mediaQuery.addEventListener("change", checkMobile);

    return () => mediaQuery.removeEventListener("change", checkMobile);
  }, []);

  console.log("🔍 TableComponent Debug - Received data:", data);
  console.log("🔍 TableComponent Debug - Data length:", data?.length);

  // Define columns for TanStack Table with sorting
  const columns: ColumnDef<CellComponentData>[] = [
    {
      id: "general",
      accessorKey: "generalNumber",
      header: "GENERAL",
      sortingFn: (rowA, rowB, columnId) => {
        // Get all table data in priority ratio order (3:1 priority to personal)
        const getPriorityRatioOrder = (tickets: CellComponentData[]) => {
          const priorityTickets = tickets
            .filter((t) => t.queueKind === "priority")
            .sort((a, b) => a.requestDate - b.requestDate); // Oldest first

          const personalTickets = tickets
            .filter((t) => t.queueKind === "personal")
            .sort((a, b) => a.requestDate - b.requestDate); // Oldest first

          const result = [];
          let priorityIndex = 0;
          let personalIndex = 0;

          while (
            priorityIndex < priorityTickets.length ||
            personalIndex < personalTickets.length
          ) {
            // Add up to 3 priority tickets
            for (
              let i = 0;
              i < 3 && priorityIndex < priorityTickets.length;
              i++
            ) {
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

        // Get all table data in priority ratio order
        const allData = table.getCoreRowModel().rows.map((r) => r.original);
        const sortedData = getPriorityRatioOrder(allData);

        // Find positions of the two rows being compared
        const indexA = sortedData.findIndex((t) => t.ref === rowA.original.ref);
        const indexB = sortedData.findIndex((t) => t.ref === rowB.original.ref);

        // Sort by position in the priority ratio order
        return indexA - indexB;
      },
    },
    {
      id: "ticket",
      accessorKey: "ticketNumber",
      header: "TICKET",
      enableSorting: false,
    },
    {
      id: "date",
      accessorKey: "requestDate",
      header: "REQUESTED ON",
      sortingFn: "basic", // Basic date/timestamp sorting
    },
  ];

  console.log("🔍 TableComponent Debug - Using data:", data);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Debug: Log table state
  const sortedRows = table.getSortedRowModel().rows;
  console.log("🔍 TableComponent Debug - Final sorted rows:", sortedRows);
  console.log(
    "🔍 TableComponent Debug - Final sorted rows length:",
    sortedRows?.length
  );

  const [isCollapsed, setIsCollapsed] = useState(false); // NEW: Collapse state, default expanded
  const toggleCollapse = () => setIsCollapsed(!isCollapsed); // NEW: Toggle

  // NEW: Scroll to corresponding TaskCard in NextUpSection
  const scrollToTaskCard = (ref: string) => {
    console.log("🔍 scrollToTaskCard called with ref:", ref);
    console.log("🔍 isMobile:", isMobile);
    console.log("🔍 enableClickToScroll:", enableClickToScroll);
    console.log("🔍 clickToScrollBreakpoint:", clickToScrollBreakpoint);

    const taskCardElement = document.querySelector(`[data-task-ref="${ref}"]`);
    const outerContainer = document.querySelector(
      '[data-element="NEXT-UP-COLUMN"]'
    );

    // Find the actual scrollable container - try multiple selectors
    let scrollContainer = outerContainer?.querySelector(
      ".overflow-y-auto"
    ) as HTMLElement;
    if (!scrollContainer) {
      scrollContainer = outerContainer?.querySelector(
        ".md\\:overflow-y-auto"
      ) as HTMLElement;
    }
    if (!scrollContainer) {
      // Fallback: find any child with scrollHeight > clientHeight
      const children = outerContainer?.querySelectorAll("*") || [];
      for (const child of children) {
        const element = child as HTMLElement;
        if (element.scrollHeight > element.clientHeight) {
          scrollContainer = element;
          break;
        }
      }
    }

    console.log("🔍 Trying fallback scroll container search...");
    if (scrollContainer) {
      console.log("🔍 Found scrollContainer via fallback:", scrollContainer);
      console.log("🔍 scrollContainer classes:", scrollContainer.className);
    }

    console.log("🔍 taskCardElement found:", !!taskCardElement);
    console.log("🔍 outerContainer found:", !!outerContainer);

    if (outerContainer) {
      console.log(
        "🔍 outerContainer children count:",
        outerContainer.children.length
      );
      console.log(
        "🔍 outerContainer children:",
        Array.from(outerContainer.children).map((child) => ({
          tagName: child.tagName,
          className: child.className,
          scrollHeight: (child as HTMLElement).scrollHeight,
          clientHeight: (child as HTMLElement).clientHeight,
        }))
      );
    }

    console.log("🔍 scrollContainer found:", !!scrollContainer);

    if (taskCardElement) {
      console.log("🔍 taskCardElement:", taskCardElement);
    }

    if (scrollContainer) {
      console.log("🔍 scrollContainer:", scrollContainer);
      console.log(
        "🔍 scrollContainer.scrollTo:",
        typeof scrollContainer.scrollTo
      );
      console.log(
        "🔍 scrollContainer.scrollHeight:",
        scrollContainer.scrollHeight
      );
      console.log(
        "🔍 scrollContainer.clientHeight:",
        scrollContainer.clientHeight
      );
    }

    if (taskCardElement && scrollContainer) {
      // Get current scroll position to account for manual scrolling
      const currentScrollTop = scrollContainer.scrollTop;
      console.log("🔍 currentScrollTop:", currentScrollTop);
      
      // Scroll to top of ScrollTrigger trigger zone (40% position for last card compatibility)
      const containerRect = scrollContainer.getBoundingClientRect();
      const cardRect = taskCardElement.getBoundingClientRect();
      
      // Calculate relative position and add current scroll offset
      const relativeScrollTop = cardRect.top - containerRect.top - containerRect.height * 0.4;
      const targetScrollTop = currentScrollTop + relativeScrollTop;
      
      console.log("🔍 containerRect:", containerRect);
      console.log("🔍 cardRect:", cardRect);
      console.log("🔍 relativeScrollTop:", relativeScrollTop);
      console.log("🔍 targetScrollTop:", targetScrollTop);

      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });

      console.log("🔍 scrollTo called with current scroll offset");
    } else {
      console.log("🔍 Cannot scroll - missing elements");
    }
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      {/* NEW: Clickable title matching page.tsx style */}
      <button
        onClick={toggleCollapse}
        className="flex items-center justify-between w-full mb-4 pb-2 border-b border-gray-subtle text-left"
        aria-expanded={!isCollapsed}
      >
        <h2 className="text-xl font-bold">ALL FAVORS</h2>
        <span
          className={`text-xs text-gray-subtle  transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {/* NEW: Wrap existing table content for collapse */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? "max-h-0" : "max-h-[60vh]"}`}
      >
        {/* Header Row */}
        <div
          className="grid gap-4 items-center p-4 border-b-2 border-gray-subtle bg-bg"
          style={{
            gridTemplateColumns: "100px 100px 100px 1fr 1fr 140px",
          }}
        >
          {/* GENERAL - Sortable */}
          <button
            className="font-semibold text-sm uppercase tracking-wider hover:text-text-muted transition-colors text-left flex items-center gap-1"
            onClick={table.getColumn("general")?.getToggleSortingHandler()}
          >
            GENERAL
            {{
              asc: " ↑",
              desc: " ↓",
            }[table.getColumn("general")?.getIsSorted() as string] ?? " ⇅"}
          </button>

          {/* TICKET - Not sortable */}
          <div className="font-semibold text-sm uppercase tracking-wider">
            TICKET
          </div>

          {/* QUEUE - Not sortable */}
          <div className="font-semibold text-sm uppercase tracking-wider">
            QUEUE
          </div>

          {/* TASK - Not sortable */}
          <div className="font-semibold text-sm uppercase tracking-wider">
            TASK
          </div>

          {/* FRIEND - Not sortable */}
          <div className="font-semibold text-sm uppercase tracking-wider">
            FRIEND
          </div>

          {/* REQUESTED ON - Sortable */}
          <button
            className="font-semibold text-sm uppercase tracking-wider hover:text-text-muted transition-colors text-left flex items-center gap-1"
            onClick={table.getColumn("date")?.getToggleSortingHandler()}
          >
            REQUESTED ON
            {{
              asc: " ↑",
              desc: " ↓",
            }[table.getColumn("date")?.getIsSorted() as string] ?? " ⇅"}
          </button>
        </div>

        {/* Data Rows */}
        <div className="space-y-0">
          {table.getSortedRowModel().rows.map((row) => {
            console.log(
              "🔍 TableComponent Debug - Rendering row data:",
              row.original
            );

            // NEW: Determine if click-to-scroll should be enabled
            const shouldEnableClickToScroll =
              enableClickToScroll &&
              (clickToScrollBreakpoint === "both" ||
                (clickToScrollBreakpoint === "desktop" && !isMobile) ||
                (clickToScrollBreakpoint === "mobile" && isMobile));

            // NEW: Enhanced click handler
            const handleRowClick = (ref: string) => {
              console.log("🔍 handleRowClick called with ref:", ref);
              console.log(
                "🔍 shouldEnableClickToScroll:",
                shouldEnableClickToScroll
              );
              console.log("🔍 isMobile:", isMobile);

              // Existing mobile behavior
              if (isMobile && onOpen) {
                console.log("🔍 Mobile: calling onOpen");
                onOpen(ref);
              }
              // NEW: Desktop click-to-scroll behavior
              if (shouldEnableClickToScroll) {
                console.log("🔍 Desktop: calling scrollToTaskCard");
                scrollToTaskCard(ref);
              } else {
                console.log(
                  "🔍 Click-to-scroll not enabled for this breakpoint"
                );
              }
            };

            return (
              <div
                key={row.id}
                className={`${isMobile ? "hover:bg-gray-subtle/20 cursor-pointer" : ""} ${
                  shouldEnableClickToScroll
                    ? "cursor-pointer hover:bg-gray-subtle/20"
                    : ""
                }`}
                onClick={() => handleRowClick(row.original.ref)}
              >
                <CellComponent
                  data={row.original}
                  onOpen={isMobile ? onOpen : undefined}
                  className="border-b-0"
                  currentTurn={currentTurn}
                  isActive={row.original.ref === activeTaskRef}
                  disableFocusStyling={disableFocusStyling}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
