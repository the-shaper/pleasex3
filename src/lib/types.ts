export type QueueKind = "personal" | "priority" | "general";

export type TaskTag =
  | "attn"
  | "pending"
  | "next-up"
  | "awaiting-feedback"
  | "finished"
  | "current";

export interface Creator {
  slug: string;
  displayName: string;
  minPriorityTipCents: number;
}

export interface QueueSnapshot {
  kind: QueueKind;
  activeTurn: number;
  nextTurn: number;
  etaMins: number;
  activeCount: number;
  enabled: boolean;
}

export interface Ticket {
  ref: string;
  creatorSlug: string;
  queueKind: QueueKind;
  tipCents: number;
  taskTitle?: string;
  message?: string;
  status: "open" | "approved" | "rejected" | "closed";
  tags?: TaskTag[];
  createdAt: number;
  // User contact fields
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  social?: string;
  attachments?: string[];
  consentEmail?: boolean;
}

export interface DashboardOverview {
  creator: Creator;
  queues: Record<QueueKind, QueueSnapshot>;
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
  // User contact fields
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
  currentTab?: string; // Add this for highlighting based on current tab
}
