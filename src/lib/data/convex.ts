import { api } from "@/../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import type { CreateTicketInput, DashboardOverview, Ticket } from "@/lib/types";
import type { DataProvider } from "@/lib/data";
import type { RowComponentData } from "@/components/Dashboard/table/rowComponent";

// Lazy initialization to avoid errors in environments without CONVEX_URL (e.g., Storybook)
let _client: ConvexHttpClient | null = null;

function getClient(): ConvexHttpClient {
  if (!_client) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
    if (!convexUrl) {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL is not set. This is required for Convex operations."
      );
    }
    const formattedUrl = convexUrl.startsWith("http")
      ? convexUrl
      : `https://${convexUrl}`;
    _client = new ConvexHttpClient(formattedUrl);
  }
  return _client;
}

export class ConvexDataProvider implements DataProvider {
  async getDashboardOverview(creatorSlug: string): Promise<DashboardOverview> {
    const res = await getClient().query(api.dashboard.getOverview, { creatorSlug });
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
          tippingEnabled: false,
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
      const res = await getClient().query(api.queues.getSnapshot, { creatorSlug });
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
          tippingEnabled: false,
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
      const res = await getClient().query(api.dashboard.getCreator, { creatorSlug });
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
    const res = await getClient().query(api.tickets.getByRef, { ref });
    return (res as unknown as Ticket | null) ?? null;
  }

  async createTicket(input: CreateTicketInput): Promise<{ ref: string }> {
    // Filter out general queue tickets for table display
    const filteredInput = {
      ...input,
      queueKind:
        input.queueKind === "general"
          ? "personal"
          : (input.queueKind as "personal" | "priority"),
    };
    const res = await getClient().mutation(api.tickets.create, filteredInput);
    return res as { ref: string };
  }

  async approveTicket(ref: string): Promise<{ ok: true }> {
    const res = await getClient().mutation(api.tickets.approve, { ref });

    // After approval, recompute workflow tags so current/next-up are persisted.
    try {
      const ticket = await getClient().query(api.tickets.getByRef, { ref });
      if (ticket && ticket.creatorSlug) {
        await getClient().mutation(api.tickets.recomputeWorkflowTagsForCreator, {
          creatorSlug: ticket.creatorSlug,
        });
      }
    } catch (error) {
      console.error("Failed to recompute workflow tags after approve", error);
    }

    return res as { ok: true };
  }

  async rejectTicket(ref: string): Promise<{ ok: true }> {
    const res = await getClient().mutation(api.tickets.reject, { ref });
    return res as { ok: true };
  }

  async getAllTicketsForTable(
    creatorSlug: string
  ): Promise<RowComponentData[]> {
    // Deprecated: TableComponent now uses engine positions directly via api.dashboard.getAllTicketsWithPositions
    // Keeping this as a thin passthrough for any remaining callers until fully removed.
    const tickets = await getClient().query(
      api.dashboard.getAllTicketsWithPositions,
      { creatorSlug }
    );

    return (tickets || []) as unknown as RowComponentData[];
  }
}
