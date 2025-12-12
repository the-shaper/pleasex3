export type QueueKind = "personal" | "priority" | "general";

export type TaskTag =
  | "attn"
  | "pending"
  | "next-up"
  | "awaiting-feedback"
  | "finished"
  | "current"
  | "rejected"
  | "closed";

export type TicketStatus =
  | "open"
  | "approved"
  | "rejected"
  | "closed"
  | "pending_payment";

export interface Creator {
  slug: string;
  displayName: string;
  minPriorityTipCents: number;
  // Stripe / payouts integration
  stripeAccountId?: string;
  payoutEnabled?: boolean;
}

// Engine-aligned queue metrics snapshot
export interface QueueMetrics {
  enabled: boolean;
  activeCount: number;
  currentTicketNumber?: number;
  nextTicketNumber?: number;
  etaDays?: number | null;
  avgDaysPerTicket?: number;
  tippingEnabled?: boolean;
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
  queueNumber?: number;
  ticketNumber?: number;
  resolvedAt?: number;
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
  closedTickets: Ticket[];
  rejectedTickets: Ticket[];
  pendingPaymentTickets: Ticket[];
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

// Stripe / Earnings types (shared between Convex and frontend)

export interface CreatorEarningsSummary {
  creatorSlug: string;
  periodStart: number; // timestamp (inclusive)
  periodEnd: number; // timestamp (exclusive)
  grossCents: number;
  stripeFeeCents: number;
  thresholdCents: number; // e.g. 5000 for $50
  platformFeeRateBps: number; // effective rate for the period (derived from $3.33 per $50 blocks)
  platformFeeCents: number;
  payoutCents: number;
  thresholdReached: boolean;
  netCents?: number;
}

export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export interface PayoutRecord {
  _id: string;
  creatorSlug: string;
  periodStart: number;
  periodEnd: number;
  grossCents: number;
  platformFeeCents: number;
  payoutCents: number;
  currency: string;
  stripeTransferId?: string;
  status: PayoutStatus;
  createdAt: number;
}

export interface StripeConnectionStatus {
  connected: boolean;
  stripeAccountId?: string;
  detailsSubmitted?: boolean;
  /** True when account exists but onboarding is not yet complete */
  onboardingStarted?: boolean;
}

export interface EarningsDashboardData {
  connection: StripeConnectionStatus;
  currentPeriod: CreatorEarningsSummary;
  lastThreePeriods: CreatorEarningsSummary[];
  allTimeGrossCents: number;
  allTimeStripeFeeCents: number;
  allTimePlatformFeeCents: number;
  allTimePayoutCents: number;
  upcomingPayout?: PayoutRecord | null;
  payoutHistory: PayoutRecord[];
}
