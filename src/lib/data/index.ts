import type { DashboardOverview, CreateTicketInput, Ticket } from "@/lib/types";

export interface DataProvider {
  getDashboardOverview(creatorSlug: string): Promise<DashboardOverview>;
  getQueueSnapshot(creatorSlug: string): Promise<any>; // Queue snapshot with personal/priority/general data
  getTicketByRef(ref: string): Promise<Ticket | null>;
  createTicket(input: CreateTicketInput): Promise<{ ref: string }>;
  approveTicket(ref: string): Promise<{ ok: true }>;
  rejectTicket(ref: string): Promise<{ ok: true }>;
}

export type { DashboardOverview, CreateTicketInput, Ticket };
