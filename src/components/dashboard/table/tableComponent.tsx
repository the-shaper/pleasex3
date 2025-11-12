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
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
        cardRect.top - containerRect.top - containerRect.height * 0.4;
      const targetScrollTop = currentScrollTop + relativeScrollTop;

      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      className={`overflow-x-auto ${className} ${variant === "past" || variant === "all" ? "min-w-max" : ""}`}
    >
      {/* NEW: Clickable title matching page.tsx style */}
      <button
        onClick={toggleCollapse}
        className="flex items-center justify-between w-full mb-4 pb-2 border-b border-gray-subtle text-left"
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

      {/* NEW: Wrap existing table content for collapse */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? "max-h-0" : "max-h-[60vh]"}`}
      >
        {/* Header Row */}
        <div
          className="grid gap-4 items-center p-4 border-b-2 border-gray-subtle bg-bg"
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

        {/* Data Rows */}
        <div className="space-y-0">
          {table.getSortedRowModel().rows.map((row) => {
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
                  // Keep existing mobile-specific behavior inside the cell if needed
                  onOpen={isMobile ? onOpen : undefined}
                  className="border-b-0"
                  isActive={row.original.ref === activeTaskRef}
                  disableFocusStyling={disableFocusStyling}
                  variant={variant}
                />
              </div>
            );
          })}
        </div>
        {/* end Data Rows */}
      </div>
    </div>
  );
}
