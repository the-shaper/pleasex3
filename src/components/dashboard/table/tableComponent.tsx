"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { useState, useEffect, useMemo } from "react";
import { CellComponent, type CellComponentData } from "./cellComponent";

// Helper function to sort tickets with 3:1 priority-to-personal ratio (moved from page.tsx)
const sortTicketsByPriorityRatio = (data: CellComponentData[]) => {
  // Separate tickets by type
  const priorityTickets = data
    .filter((t) => t.queueKind === "priority")
    .sort((a, b) => a.requestDate - b.requestDate); // Oldest first within priority

  const personalTickets = data
    .filter((t) => t.queueKind === "personal")
    .sort((a, b) => a.requestDate - b.requestDate); // Oldest first within personal

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

// Re-export for convenience
export type { CellComponentData };

export type TableVariant = "active" | "past" | "all";

export interface TableComponentProps {
  data: CellComponentData[];
  onOpen?: (ref: string) => void;
  className?: string;
  activeTaskRef?: string; // Track active task from ScrollTrigger
  enableClickToScroll?: boolean; // NEW: Enable click-to-scroll functionality
  clickToScrollBreakpoint?: "mobile" | "desktop" | "both"; // NEW: Control when click-to-scroll is active
  disableFocusStyling?: boolean; // NEW: Disable focus styling for dashboard context
  variant?: TableVariant; // NEW: Table variant for different layouts
}

// Helper function to get grid columns based on variant (moved outside component)
const getGridColumns = (variant: TableVariant) => {
  switch (variant) {
    case "past":
    case "all":
      return "100px 100px 100px 1fr 1fr 120px 80px 100px 140px"; // GENERAL, TICKET, QUEUE, TASK, FRIEND, TAGS, STATUS, TIP, REQUESTED ON
    case "active":
    default:
      return "100px 100px 100px 1fr 1fr 140px"; // Current layout
  }
};

// Helper function to filter data based on variant (moved outside component)
const getFilteredData = (data: CellComponentData[], variant: TableVariant) => {
  if (!Array.isArray(data)) {
    return [];
  }

  switch (variant) {
    case "past":
      // Show completed/decided tickets
      return data.filter(
        (ticket) => ticket.status === "closed" || ticket.status === "rejected"
      );
    case "all":
      // Show everything
      return data;
    case "active":
    default:
      // Show tickets that are in play (open or approved)
      return data.filter(
        (ticket) => ticket.status === "open" || ticket.status === "approved"
      );
  }
};

export function TableComponent({
  data,
  onOpen,
  className = "",
  activeTaskRef,
  enableClickToScroll = false,
  clickToScrollBreakpoint = "desktop",
  disableFocusStyling = false,
  variant = "active",
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

  // Filter data based on variant using useMemo to prevent infinite re-renders
  const filteredData = useMemo(() => {
    return getFilteredData(data, variant);
  }, [data, variant]);

  // Apply custom sorting logic: 3:1 pattern by default, numeric sort when GENERAL column is explicitly sorted
  const sortedData = useMemo(() => {
    const isGeneralSorted = sorting.length > 0 && sorting[0].id === "general";
    
    if (!isGeneralSorted) {
      // Default: apply 3:1 priority-to-personal pattern
      return sortTicketsByPriorityRatio(filteredData);
    } else if (sorting[0].desc === false) {
      // GENERAL sorted ascending: simple numeric ascending
      return [...filteredData].sort((a, b) => {
        const aNum = a.generalNumber ?? Infinity;
        const bNum = b.generalNumber ?? Infinity;
        return aNum - bNum;
      });
    } else {
      // GENERAL sorted descending: simple numeric descending
      return [...filteredData].sort((a, b) => {
        const aNum = a.generalNumber ?? -Infinity;
        const bNum = b.generalNumber ?? -Infinity;
        return bNum - aNum;
      });
    }
  }, [filteredData, sorting]);

  // Define columns for TanStack Table with sorting
  const columns: ColumnDef<CellComponentData>[] = [
    {
      id: "general",
      accessorKey: "generalNumber",
      header: "GENERAL",
      // Rely on generalNumber from engine; basic numeric sort
      sortingFn: "basic",
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

  const table = useReactTable({
    data: sortedData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true, // We handle sorting manually
  });

  const [isCollapsed, setIsCollapsed] = useState(false); // NEW: Collapse state, default expanded
  const toggleCollapse = () => setIsCollapsed(!isCollapsed); // NEW: Toggle

  // NEW: Scroll to corresponding TaskCard in NextUpSection
  const scrollToTaskCard = (ref: string) => {
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
      const children = Array.from(outerContainer?.querySelectorAll("*") || []);
      for (const child of children) {
        const element = child as HTMLElement;
        if (element.scrollHeight > element.clientHeight) {
          scrollContainer = element;
          break;
        }
      }
    }

    if (taskCardElement && scrollContainer) {
      // Get current scroll position to account for manual scrolling
      const currentScrollTop = scrollContainer.scrollTop;

      // Scroll to top of ScrollTrigger trigger zone (40% position for last card compatibility)
      const containerRect = scrollContainer.getBoundingClientRect();
      const cardRect = taskCardElement.getBoundingClientRect();

      // Calculate relative position and add current scroll offset
      const relativeScrollTop =
        cardRect.top - containerRect.top - containerRect.height * 0.1;
      const targetScrollTop = currentScrollTop + relativeScrollTop;

      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  };

  const isWideLayout = variant === "past" || variant === "all";

  const gridRows = isCollapsed ? "auto 0fr" : "auto 1fr";

  return (
    <div
      className={`grid h-full min-h-0 transition-[grid-template-rows] duration-300 ease-in-out ${className}`}
      style={{ gridTemplateRows: gridRows }}
    >
      {/* NEW: Clickable title matching page.tsx style */}
      <button
        onClick={toggleCollapse}
        className="flex items-center justify-between w-full mb-4 pb-2 border-b border-gray-subtle text-left sticky top-0 bg-bg z-10"
        aria-expanded={!isCollapsed}
      >
        <h2 className="text-xl font-bold">
          {variant === "past"
            ? "PAST FAVORS"
            : variant === "all"
              ? "ALL FAVORS"
              : "ACTIVE FAVORS"}
        </h2>
        <span
          className={`text-xs text-gray-subtle  transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {/* NEW: Wrap existing table content for collapse with flexible height */}
      <div className="flex flex-col overflow-hidden min-h-0">
        {/* Header Row */}
        <div className="flex-none overflow-x-auto">
          <div
            className={`grid gap-4 items-center p-4 border-b-2 border-gray-subtle bg-bg  ${isWideLayout ? "min-w-max" : ""}`}
            style={{
              gridTemplateColumns: getGridColumns(variant),
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

            {/* CONDITIONAL: TAGS - Only for past/all variants */}
            {(variant === "past" || variant === "all") && (
              <div className="font-semibold text-sm uppercase tracking-wider">
                TAGS
              </div>
            )}

            {/* CONDITIONAL: STATUS - Only for past/all variants */}
            {(variant === "past" || variant === "all") && (
              <div className="font-semibold text-sm uppercase tracking-wider">
                STATUS
              </div>
            )}

            {/* CONDITIONAL: TIP - Only for past/all variants */}
            {(variant === "past" || variant === "all") && (
              <div className="font-semibold text-sm uppercase tracking-wider">
                TIP
              </div>
            )}

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
        </div>

        {/* Data Rows */}
        <div className="flex-1 overflow-hidden">
          <div
            className={`h-full overflow-y-auto overflow-x-auto pb-6 no-scrollbar ${isWideLayout ? "min-w-max" : ""}`}
          >
            {sortedData.map((rowData) => {
              const shouldEnableClickToScroll =
                enableClickToScroll &&
                (clickToScrollBreakpoint === "both" ||
                  (clickToScrollBreakpoint === "desktop" && !isMobile) ||
                  (clickToScrollBreakpoint === "mobile" && isMobile));

              const handleRowClick = (ref: string) => {
                // Always notify parent so PAST/ALL can open their modal.
                if (onOpen) {
                  onOpen(ref);
                }

                // Optionally scroll the corresponding task card into view
                // (used by ACTIVE desktop layout only when enabled by props).
                if (shouldEnableClickToScroll) {
                  scrollToTaskCard(ref);
                }
              };

              return (
                <div
                  key={rowData.ref}
                  className={`${isMobile ? "hover:bg-gray-subtle/20 cursor-pointer" : ""} ${
                    shouldEnableClickToScroll
                      ? "cursor-pointer hover:bg-gray-subtle/20"
                      : ""
                  }`}
                  onClick={() => handleRowClick(rowData.ref)}
                >
                  <CellComponent
                    data={rowData}
                    // Keep existing mobile-specific behavior inside the cell if needed
                    onOpen={isMobile ? onOpen : undefined}
                    className="border-b-0"
                    isActive={rowData.ref === activeTaskRef}
                    disableFocusStyling={disableFocusStyling}
                    variant={variant}
                  />
                </div>
              );
            })}
          </div>
        </div>
        {/* end Data Rows */}
      </div>
    </div>
  );
}
