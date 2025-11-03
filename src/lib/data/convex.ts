import { api } from "@/../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import type { CreateTicketInput, DashboardOverview, Ticket } from "@/lib/types";
import type { DataProvider } from "@/lib/data";
import type { CellComponentData } from "@/components/dashboard/table/cellComponent";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export class ConvexDataProvider implements DataProvider {
  async getDashboardOverview(creatorSlug: string): Promise<DashboardOverview> {
    const res = await client.query(api.dashboard.getOverview, { creatorSlug });
    return res as unknown as DashboardOverview;
  }

  async getQueueSnapshot(creatorSlug: string): Promise<any> {
    if (!creatorSlug || typeof creatorSlug !== "string") {
      console.error(
        "getQueueSnapshot called with invalid creatorSlug:",
        creatorSlug
      );
      return {
        personal: {
          activeTurn: 0,
          nextTurn: 1,
          etaMins: 0,
          activeCount: 0,
          enabled: false,
        },
        priority: {
          activeTurn: 0,
          nextTurn: 1,
          etaMins: 0,
          activeCount: 0,
          enabled: false,
        },
        general: {
          activeTurn: 0,
          nextTurn: 1,
          etaMins: 0,
          activeCount: 0,
          enabled: false,
        },
      };
    }

    try {
      const res = await client.query(api.queues.getSnapshot, { creatorSlug });
      return res as any;
    } catch (error) {
      console.error(
        "Error in getQueueSnapshot:",
        error,
        "for slug:",
        creatorSlug
      );
      return {
        personal: {
          activeTurn: 0,
          nextTurn: 1,
          etaMins: 0,
          activeCount: 0,
          enabled: false,
        },
        priority: {
          activeTurn: 0,
          nextTurn: 1,
          etaMins: 0,
          activeCount: 0,
          enabled: false,
        },
        general: {
          activeTurn: 0,
          nextTurn: 1,
          etaMins: 0,
          activeCount: 0,
          enabled: false,
        },
      };
    }
  }

  async getCreatorInfo(
    creatorSlug: string
  ): Promise<{ displayName: string; minPriorityTipCents: number } | null> {
    if (!creatorSlug || typeof creatorSlug !== "string") {
      console.error(
        "getCreatorInfo called with invalid creatorSlug:",
        creatorSlug
      );
      return {
        displayName: "Unknown Creator",
        minPriorityTipCents: 1500,
      };
    }

    try {
      const res = await client.query(api.dashboard.getCreator, { creatorSlug });
      if (!res) {
        // Return default values for creators that don't exist yet
        return {
          displayName: creatorSlug,
          minPriorityTipCents: 1500,
        };
      }
      return res as { displayName: string; minPriorityTipCents: number };
    } catch (error) {
      console.error(
        "Error in getCreatorInfo:",
        error,
        "for slug:",
        creatorSlug
      );
      // Return fallback values on error
      return {
        displayName: creatorSlug,
        minPriorityTipCents: 1500,
      };
    }
  }

  async getTicketByRef(ref: string): Promise<Ticket | null> {
    const res = await client.query(api.tickets.getByRef, { ref });
    return (res as unknown as Ticket | null) ?? null;
  }

  async createTicket(input: CreateTicketInput): Promise<{ ref: string }> {
    const res = await client.mutation(api.tickets.create, input);
    return res as { ref: string };
  }

  async approveTicket(ref: string): Promise<{ ok: true }> {
    const res = await client.mutation(api.tickets.approve, { ref });
    return res as { ok: true };
  }

  async rejectTicket(ref: string): Promise<{ ok: true }> {
    const res = await client.mutation(api.tickets.reject, { ref });
    return res as { ok: true };
  }

  async getAllTicketsForTable(
    creatorSlug: string
  ): Promise<CellComponentData[]> {
    const tickets = await client.query(
      api.dashboard.getAllTicketsWithPositions,
      { creatorSlug }
    );
    // Debug: Log raw tickets from Convex
    console.log(
      "🔍 Convex Debug - Raw tickets from getAllTicketsWithPositions:",
      tickets
    );
    console.log("🔍 Convex Debug - Raw tickets length:", tickets?.length);

    // Filter out "general" queue tickets and map to CellComponentData format
    const mappedData = tickets
      .filter(
        (ticket: any) =>
          ticket.queueKind === "personal" || ticket.queueKind === "priority"
      )
      .map((ticket: any) => ({
        generalNumber: ticket.generalNumber,
        ticketNumber: ticket.ticketNumber,
        queueKind: ticket.queueKind as "personal" | "priority",
        task: ticket.taskTitle || "",
        submitterName: ticket.name || "Anonymous",
        requestDate: ticket.createdAt,
        ref: ticket.ref,
        status: ticket.status as "open" | "approved" | "rejected" | "closed",
      }));

    // Debug: Log mapped data
    console.log(
      "🔍 Convex Debug - Mapped data for TableComponent:",
      mappedData
    );
    console.log("🔍 Convex Debug - Mapped data length:", mappedData?.length);

    // TEMP: If no data, add test data to verify rendering works
    if (mappedData.length === 0) {
      console.log("🔍 Convex Debug - No tickets found, adding test data");
      const testData = [
        {
          generalNumber: 1,
          ticketNumber: 1,
          queueKind: "priority" as const,
          task: "Test priority task",
          submitterName: "Test User",
          requestDate: Date.now(),
          ref: "TEST-REF-123",
          status: "open" as const,
        },
        {
          generalNumber: 2,
          ticketNumber: 2,
          queueKind: "personal" as const,
          task: "Test personal task",
          submitterName: "Another User",
          requestDate: Date.now(),
          ref: "TEST-REF-456",
          status: "approved" as const,
        },
      ];
      return testData;
    }

    return mappedData;
  }
}
