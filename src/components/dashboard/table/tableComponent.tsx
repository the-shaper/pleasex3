"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import { useState } from "react";
import { CellComponent, type CellComponentData } from "./cellComponent";

// Re-export for convenience
export type { CellComponentData };

export interface TableComponentProps {
  data: CellComponentData[];
  onOpen?: (ref: string) => void;
  className?: string;
  currentTurn?: number;
}

export function TableComponent({
  data,
  onOpen,
  className = "",
  currentTurn,
}: TableComponentProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

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

  return (
    <div className={`overflow-x-auto ${className}`}>
      {/* Header Row */}
      <div
        className="grid gap-4 items-center p-4 border-b-2 border-gray-subtle bg-bg"
        style={{
          gridTemplateColumns: "100px 100px 100px 1fr 1fr 140px 120px",
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

        {/* OPEN button column - no header needed */}
        <div className="font-semibold text-sm uppercase tracking-wider"></div>
      </div>

      {/* Data Rows */}
      <div className="space-y-0">
        {table.getSortedRowModel().rows.map((row) => (
          <div key={row.id} className="hover:bg-gray-subtle/20">
            <CellComponent
              data={row.original}
              onOpen={onOpen}
              className="border-b-0"
              currentTurn={currentTurn}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
