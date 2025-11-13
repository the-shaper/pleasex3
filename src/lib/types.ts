export type QueueKind = "personal" | "priority" | "general";

export type TaskTag =
  | "attn"
  | "pending"
  | "next-up"
  | "awaiting-feedback"
  | "finished"
  | "current";

export type TicketStatus = "open" | "approved" | "rejected" | "closed";

export interface Creator {
  slug: string;
  displayName: string;
  minPriorityTipCents: number;
}

// Engine-aligned queue metrics snapshot
export interface QueueMetrics {
  enabled: boolean;
  activeCount: number;
  currentTicketNumber?: number;
  nextTicketNumber?: number;
  etaMins?: number | null;
}

// Engine-aligned snapshot: per-queue and general
export interface QueueSnapshot {
  personal: QueueMetrics;
  priority: QueueMetrics;
  general: QueueMetrics;
}

// Shared Ticket type for Convex docs (raw ticket)
export interface Ticket {
  ref: string;
  creatorSlug: string;
  queueKind: QueueKind;
  tipCents: number;
  taskTitle?: string;
  message?: string;
  status: TicketStatus;
  tags?: string[];
  createdAt: number;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  social?: string;
  attachments?: string[];
  consentEmail?: boolean;
}

// Engine TicketPosition exposed to clients
export interface TicketPosition {
  ref: string;
  queueKind: Exclude<QueueKind, "general">;
  status: TicketStatus;
  ticketNumber?: number;
  queueNumber?: number;
  tag?: TaskTag;
  activeBeforeYou?: number;
}

export interface DashboardOverview {
  creator: Creator;
  // Note: Overview.queues is kept as-is for now where used; components that need
  // canonical metrics should prefer QueueSnapshot from api.queues.getSnapshot.
  queues: Record<QueueKind, any>;
  openTickets: Ticket[];
  approvedTickets: Ticket[];
}

export interface CreateTicketInput {
  creatorSlug: string;
  queueKind: QueueKind;
  tipCents: number;
  taskTitle?: string;
  message?: string;
  tags?: TaskTag[];
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  social?: string;
  attachments?: string[];
  consentEmail?: boolean;
}

export interface SidebarLinkProps {
  href: string;
  label: string;
}

export interface SidebarSectionProps {
  title: string;
  links: SidebarLinkProps[];
}

export interface SideBarProps {
  sections: SidebarSectionProps[];
  initialActiveLink?: string;
  currentTab?: string;
  isOpen?: boolean;
  onClose?: () => void;
  mobileOverlay?: boolean;
}
