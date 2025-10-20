import type {
  CreateTicketInput,
  Creator,
  DashboardOverview,
  QueueKind,
  QueueSnapshot,
  Ticket,
} from "@/lib/types";
import type { DataProvider } from "@/lib/data";

const demoCreator: Creator = {
  slug: "demo",
  displayName: "Demo",
  minPriorityTipCents: 1500,
};

const initialQueues: Record<QueueKind, QueueSnapshot> = {
  personal: {
    kind: "personal",
    activeTurn: 2,
    nextTurn: 17,
    etaMins: 90,
    activeCount: 5,
    enabled: true,
  },
  priority: {
    kind: "priority",
    activeTurn: 5,
    nextTurn: 9,
    etaMins: 45,
    activeCount: 2,
    enabled: true,
  },
  general: {
    kind: "general",
    activeTurn: 7, // 2 + 5
    nextTurn: 26, // 17 + 9
    etaMins: 45, // min(90, 45)
    activeCount: 7, // 5 + 2
    enabled: true,
  },
};

let tickets: Ticket[] = [];

function generateRef(creatorSlug: string): string {
  const seq = tickets.length + 1;
  const prefix = creatorSlug.toUpperCase();
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}

export class MockDataProvider implements DataProvider {
  async getDashboardOverview(creatorSlug: string): Promise<DashboardOverview> {
    if (creatorSlug !== demoCreator.slug) {
      return {
        creator: { ...demoCreator, slug: creatorSlug },
        queues: initialQueues,
        openTickets: [],
      };
    }

    const openTickets = tickets.filter((t) => t.status === "open");
    return {
      creator: demoCreator,
      queues: initialQueues,
      openTickets,
    };
  }

  async getQueueSnapshot(creatorSlug: string): Promise<any> {
    if (creatorSlug !== demoCreator.slug) {
      return initialQueues;
    }
    return initialQueues;
  }

  async getTicketByRef(ref: string): Promise<Ticket | null> {
    const ticket = tickets.find((t) => t.ref === ref);
    return ticket ?? null;
  }

  async createTicket(input: CreateTicketInput): Promise<{ ref: string }> {
    const ref = generateRef(input.creatorSlug);
    const newTicket: Ticket = {
      ref,
      creatorSlug: input.creatorSlug,
      queueKind: input.queueKind,
      tipCents: input.tipCents,
      message: input.message,
      status: "open",
      createdAt: Date.now(),
    };
    tickets = [newTicket, ...tickets];
    return { ref };
  }

  async approveTicket(ref: string): Promise<{ ok: true }> {
    const idx = tickets.findIndex((t) => t.ref === ref);
    if (idx === -1) return { ok: true };
    const t = tickets[idx];
    if (t.status !== "open") return { ok: true };
    tickets[idx] = { ...t, status: "approved" };
    return { ok: true };
  }

  async rejectTicket(ref: string): Promise<{ ok: true }> {
    const idx = tickets.findIndex((t) => t.ref === ref);
    if (idx === -1) return { ok: true };
    const t = tickets[idx];
    if (t.status !== "open") return { ok: true };
    tickets[idx] = { ...t, status: "rejected" };
    return { ok: true };
  }
}
