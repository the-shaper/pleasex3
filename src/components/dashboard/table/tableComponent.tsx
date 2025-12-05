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

// Re-export for convenience
export type { CellComponentData };

import { getGridColumns, TableVariant } from "./tableLayout";

export interface TableComponentProps {
  data: CellComponentData[];
  onOpen?: (ref: string) => void;
  className?: string;
  activeTaskRef?: string; // Track active task from ScrollTrigger
  enableClickToScroll?: boolean; // NEW: Enable click-to-scroll functionality
  clickToScrollBreakpoint?: "mobile" | "desktop" | "both"; // NEW: Control when click-to-scroll is active
  disableFocusStyling?: boolean; // NEW: Disable focus styling for dashboard context
  variant?: TableVariant; // NEW: Table variant for different layouts
  disableCollapse?: boolean; // NEW: Disable collapse functionality
}

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
  disableCollapse = false,
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

  // Apply custom sorting logic: numeric sort when GENERAL column is explicitly sorted
  const sortedData = useMemo(() => {
    const isGeneralSorted = sorting.length > 0 && sorting[0].id === "general";

    if (!isGeneralSorted) {
      // Default: show data as-is (respect parent's order)
      return filteredData;
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
    {
      id: "resolved",
      accessorKey: "resolvedAt",
      header: "RESOLVED ON",
      sortingFn: "basic",
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
    // Wait for React to finish rendering and layout to settle
    setTimeout(() => {
      // Find the scrollable container using the data-element attribute
      const scrollContainer = document.querySelector(
        '[data-element="NEXT-UP-SCROLL-CONTAINER"]'
      ) as HTMLElement;

      // Scope search to the container to avoid finding hidden mobile elements
      const taskCardElement = scrollContainer?.querySelector(
        `[data-task-ref="${ref}"]`
      );

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
    }, 100); // Wait 100ms for React layout to settle
  };

  const isWideLayout = variant === "past" || variant === "all";

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {/* Clickable title matching page.tsx style */}
      {disableCollapse ? (
        <div className="flex items-center justify-between w-full md:mb-2 md:pb-2 md:pt-0 py-2 md:px-4 border-b border-gray-subtle sticky top-0 bg-bg z-10">
          <h2 className="md:text-xl text-md font-bold">
            {variant === "past"
              ? "PAST FAVORS"
              : variant === "all"
                ? "ALL FAVORS"
                : "ACTIVE FAVORS"}
          </h2>
        </div>
      ) : (
        <button
          onClick={toggleCollapse}
          className="flex items-center justify-between w-full  border-b border-gray-subtle text-left sticky top-0 bg-bg pb-2 z-10"
          aria-expanded={!isCollapsed}
        >
          <h2 className="md:text-xl text-md font-bold">
            {variant === "past"
              ? "PAST FAVORS"
              : variant === "all"
                ? "ALL FAVORS"
                : "ACTIVE FAVORS"}
          </h2>
          <span
            className={`text-xs text-gray-subtle transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
      )}

      {/* Collapsible content wrapper with grid animation */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out flex-1 min-h-0"
        style={{ gridTemplateRows: isCollapsed ? "0fr" : "1fr" }}
      >
        <div className="overflow-hidden min-h-0">
          {/* Shared horizontal scroll container for header and data */}
          <div className="h-full overflow-x-auto overflow-y-auto no-scrollbar">
            <div className="min-w-max flex flex-col h-full">
              {/* Header Row - Sticky */}
              <div className="flex-none sticky top-0 z-10 bg-bg">
                <div
                  className={`grid gap-4 items-center px-4 pb-2 border-b-2 border-gray-subtle`}
                  style={{
                    gridTemplateColumns: getGridColumns(variant),
                  }}
                >
                  {/* GENERAL - Sortable */}
                  <button
                    className="font-semibold text-sm uppercase tracking-wider hover:text-text-muted transition-colors text-left flex items-start gap-1"
                    onClick={table
                      .getColumn("general")
                      ?.getToggleSortingHandler()}
                  >
                    GENERAL
                    {{
                      asc: " ↑",
                      desc: " ↓",
                    }[table.getColumn("general")?.getIsSorted() as string] ??
                      " ⇅"}
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

                  {/* CONDITIONAL: RESOLVED ON - Only for past/all variants */}
                  {(variant === "past" || variant === "all") && (
                    <button
                      className="font-semibold text-sm uppercase tracking-wider hover:text-text-muted transition-colors text-left flex items-center gap-1"
                      onClick={table
                        .getColumn("resolved")
                        ?.getToggleSortingHandler()}
                    >
                      RESOLVED ON
                      {{
                        asc: " ↑",
                        desc: " ↓",
                      }[table.getColumn("resolved")?.getIsSorted() as string] ??
                        " ⇅"}
                    </button>
                  )}
                </div>
              </div>

              {/* Data Rows */}
              <div className="flex-1 pb-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}
