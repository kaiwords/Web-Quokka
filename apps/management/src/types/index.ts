// -----------------------------------------------
// Enums (mirroring Prisma enums for client-side use)
// -----------------------------------------------

// Minimum length for any user-chosen password, shared by the self-signup,
// invite-acceptance and reset flows. Declared here rather than in
// src/lib/password.ts because the sign-up form needs it in the browser and
// that module imports node:crypto.
export const MIN_PASSWORD_LENGTH = 8;

// How a Client record came into existence. "SelfSignup" rows are created by
// the public website's sign-up form and are unvetted until a staff member
// approves them (Client.approvedAt) — treat them as prospects, not clients.
export type ClientSource = "Staff" | "SelfSignup";

export type ClientStage =
  | "Onboarding"
  | "RequirementsGathering"
  | "BrdPrdDrafted"
  | "Submitted"
  | "FeedbackReceived"
  | "Deployment"
  | "FinalSubmission"
  | "Maintenance"
  | "Completed";

export type PaymentStatus = "NotPaid" | "PartiallyPaid" | "Paid";
// Where an admin-assigned follow-up task got to. No approval step — the
// person it is assigned to just reports progress, and "Cancelled" is the
// honest end state for work that couldn't be finished.
export type TaskStatus = "Todo" | "InProgress" | "Done" | "Cancelled";
export type MoscowPriority = "Must" | "Should" | "Could" | "Wont";
// "Urgent" is only ever set by portal-raised (source: Client) tickets —
// staff Requests stick to Low/Medium/High in their own UI.
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";
export type TicketStatus = "New" | "InProgress" | "Done";
// "User" = a Request (raised by any logged-in staff user);
// "Client" = a support ticket raised by a portal user — see PortalTicket*.
export type TicketSource = "User" | "Client";

// -----------------------------------------------
// Domain Types
// -----------------------------------------------

export interface Requirement {
  id: number;
  clientId: number;
  role: string;
  functionality: string;
  value: string;
  priority: MoscowPriority;
  createdAt: string;
}

export interface Task {
  id: number;
  clientId: number;
  title: string;
  // `assigneeUserId` is the real assignment (and who gets notified);
  // `assignee` is the denormalized username shown in lists. null id =
  // genuinely unassigned.
  assignee: string;
  assigneeUserId: number | null;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Named DocumentFile to avoid clashing with the DOM's global `Document` type.
export interface DocumentFile {
  id: number;
  clientId: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

// One shape backs staff "Requests" (source: User) and portal-raised support
// tickets (source: Client) — see the Ticket model in schema.prisma. Portal
// tickets use the wider PortalTicketStatus range in `status`; Requests keep
// TicketStatus values — same String column, each surface only ever writes
// its own known values.
export interface Ticket {
  id: number;
  source: TicketSource;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus | PortalTicketStatus;
  assignedTo: string;
  assignedToUserId: number | null;
  satisfactionRating: number | null;
  resolvedAt: string | null;
  clientId: number | null;
  createdByPortalUserId: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  name: string;
  company: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  stage: ClientStage;
  paymentStatus: PaymentStatus;
  amountPaid: string;
  totalAmount: string;
  mvpSentAt: string | null;
  mvpApprovedAt: string | null;
  source: ClientSource;
  approvedAt: string | null;
  approvedBy: string;
  requirements: Requirement[];
  tasks: Task[];
  documents: DocumentFile[];
  createdAt: string;
  updatedAt: string;
}

// Lightweight shape returned by the list endpoint (no nested arrays needed
// for the clients table — just the counts used to render badges).
export interface ClientSummary extends Omit<Client, "requirements" | "tasks"> {
  requirementCount: number;
  taskCount: number;
  openTaskCount: number;
}

// -----------------------------------------------
// API Response Types
// -----------------------------------------------

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface DashboardStats {
  totalClients: number;
  workingOnCount: number;
  workedWithCount: number;
  openTaskCount: number;
  tasksDoneCount: number;
  // Cancelled tasks are excluded from the total, so done + open = total.
  tasksTotalCount: number;
  tasksCancelledCount: number;
  paymentOutstandingCount: number;
  mvpPendingApprovalCount: number;
  stageBreakdown: { stage: ClientStage; count: number }[];
}

// -----------------------------------------------
// Form Types
// -----------------------------------------------

export interface ClientFormValues {
  name: string;
  company: string;
  contactEmail: string;
  contactPhone: string;
}

export interface RequirementFormValues {
  role: string;
  functionality: string;
  value: string;
  priority: MoscowPriority;
}

export interface TaskFormValues {
  clientId: number;
  title: string;
  assignee: string;
}

// -----------------------------------------------
// Display Helpers
// -----------------------------------------------

// Order drives the lifecycle stepper on the client detail page.
export const CLIENT_STAGES: ClientStage[] = [
  "Onboarding",
  "RequirementsGathering",
  "BrdPrdDrafted",
  "Submitted",
  "FeedbackReceived",
  "Deployment",
  "FinalSubmission",
  "Maintenance",
  "Completed",
];

export const CLIENT_STAGE_LABELS: Record<ClientStage, string> = {
  Onboarding: "Onboarding",
  RequirementsGathering: "Gathering Requirements",
  BrdPrdDrafted: "BRD / PRD Drafted",
  Submitted: "Submitted",
  FeedbackReceived: "Feedback Received",
  Deployment: "Deployment",
  FinalSubmission: "Final Submission",
  Maintenance: "Maintenance",
  Completed: "Completed",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  NotPaid: "Not Paid",
  PartiallyPaid: "Partially Paid",
  Paid: "Paid",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  Todo: "To Do",
  InProgress: "In Progress",
  Done: "Done",
  Cancelled: "Cancelled",
};

// Order drives the status dropdown and the filter chips.
export const TASK_STATUSES: TaskStatus[] = ["Todo", "InProgress", "Done", "Cancelled"];

// "Open" = still someone's problem. Done and Cancelled are both closed —
// cancelled work is finished with, it just never shipped.
export const OPEN_TASK_STATUSES: TaskStatus[] = ["Todo", "InProgress"];

export function isTaskOpen(status: TaskStatus): boolean {
  return status === "Todo" || status === "InProgress";
}

// Tailwind color tone used to render each status as a badge.
export const CLIENT_STAGE_TONE: Record<ClientStage, string> = {
  Onboarding: "sky",
  RequirementsGathering: "sky",
  BrdPrdDrafted: "violet",
  Submitted: "violet",
  FeedbackReceived: "amber",
  Deployment: "teal",
  FinalSubmission: "indigo",
  Maintenance: "emerald",
  Completed: "slate",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, string> = {
  NotPaid: "rose",
  PartiallyPaid: "amber",
  Paid: "emerald",
};

export const TASK_STATUS_TONE: Record<TaskStatus, string> = {
  Todo: "slate",
  InProgress: "amber",
  Done: "emerald",
  Cancelled: "rose",
};

export const TICKET_STATUSES: TicketStatus[] = ["New", "InProgress", "Done"];
export const TICKET_PRIORITIES: TicketPriority[] = ["Low", "Medium", "High", "Urgent"];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  New: "New",
  InProgress: "In Progress",
  Done: "Done",
};

export const TICKET_STATUS_TONE: Record<TicketStatus, string> = {
  New: "sky",
  InProgress: "amber",
  Done: "emerald",
};

export const TICKET_PRIORITY_TONE: Record<TicketPriority, string> = {
  Low: "slate",
  Medium: "amber",
  High: "rose",
  Urgent: "rose",
};

export function stageIndex(stage: ClientStage): number {
  return CLIENT_STAGES.indexOf(stage);
}

// "Worked with" = a fully completed/archived engagement.
// Everything else, including ongoing maintenance retainers, is "working on".
export function isWorkingOn(client: Pick<Client, "stage">): boolean {
  return client.stage !== "Completed";
}

// Cancelled tasks leave the denominator — work that was called off
// shouldn't read as work the team failed to complete.
export function taskCompletionRate(tasks: Pick<Task, "status">[]): number {
  const counted = tasks.filter((t) => t.status !== "Cancelled");
  if (counted.length === 0) return 0;
  return Math.round((counted.filter((t) => t.status === "Done").length / counted.length) * 100);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// -----------------------------------------------
// Client Portal (Phase 1)
// -----------------------------------------------

export type PortalRole = "Owner" | "Manager" | "Viewer";
export type PortalUserStatus = "PendingVerification" | "Invited" | "Active" | "Disabled";
export type ProjectStatus = "Discovery" | "Design" | "Development" | "Testing" | "Deployed" | "Maintenance";
export type MilestoneStatus = "Upcoming" | "InProgress" | "Completed";
export type MilestoneApprovalStatus = "Pending" | "Approved" | "ChangesRequested";
export type ChangeRequestStatus =
  | "Submitted"
  | "UnderReview"
  | "QuoteSent"
  | "Approved"
  | "Declined"
  | "InProgress"
  | "Completed";
export type PortalTicketStatus = "Open" | "InProgress" | "WaitingOnClient" | "Resolved" | "Closed";
export type PortalTicketCategory = "Bug" | "ContentUpdate" | "TechnicalQuestion" | "Billing" | "Other";
// "Client" is the direct staff <-> client conversation: threadId is the
// clientId itself, not a per-thread record — one running thread per business.
export type MessageThreadType = "Ticket" | "ChangeRequest" | "Suggestion" | "Client";
export type MessageAuthorType = "Staff" | "Portal" | "System";

export interface PortalUser {
  id: number;
  clientId: number;
  name: string;
  email: string;
  role: PortalRole;
  status: PortalUserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface ProjectTask {
  id: number;
  milestoneId: number;
  title: string;
  done: boolean;
  order: number;
}

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  status: MilestoneStatus;
  dueDate: string | null;
  order: number;
  tasks: ProjectTask[];
  approvalStatus: MilestoneApprovalStatus;
  approvalComment: string;
  approvedByPortalUserId: number | null;
  approvedAt: string | null;
}

export interface ProjectUpdate {
  id: number;
  projectId: number;
  body: string;
  imageUrls: string[];
  links: string[];
  postedBy: string;
  createdAt: string;
}

export interface Project {
  id: number;
  clientId: number;
  name: string;
  status: ProjectStatus;
  stagingUrl: string;
  liveUrl: string;
  milestones: Milestone[];
  updates: ProjectUpdate[];
  documents: DocumentFile[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequest {
  id: number;
  clientId: number;
  projectId: number | null;
  title: string;
  description: string;
  pageSection: string;
  referenceLinks: string;
  desiredDeadline: string | null;
  status: ChangeRequestStatus;
  includedInPlan: boolean;
  quoteAmount: string;
  quoteEstimatedTime: string;
  createdByPortalUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  threadType: MessageThreadType;
  threadId: number;
  authorType: MessageAuthorType;
  authorName: string;
  body: string;
  createdAt: string;
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  "Discovery",
  "Design",
  "Development",
  "Testing",
  "Deployed",
  "Maintenance",
];

export const CHANGE_REQUEST_STATUSES: ChangeRequestStatus[] = [
  "Submitted",
  "UnderReview",
  "QuoteSent",
  "Approved",
  "Declined",
  "InProgress",
  "Completed",
];

export const CHANGE_REQUEST_STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  Submitted: "Submitted",
  UnderReview: "Under Review",
  QuoteSent: "Quote Sent",
  Approved: "Approved",
  Declined: "Declined",
  InProgress: "In Progress",
  Completed: "Completed",
};

// Every status in one list gets its own tone — "Quote Sent" had collided
// with "In Progress" (both amber), which made the list unscannable.
export const CHANGE_REQUEST_STATUS_TONE: Record<ChangeRequestStatus, string> = {
  Submitted: "sky",
  UnderReview: "violet",
  QuoteSent: "teal",
  Approved: "emerald",
  Declined: "rose",
  InProgress: "amber",
  Completed: "slate",
};

export const PORTAL_TICKET_STATUSES: PortalTicketStatus[] = [
  "Open",
  "InProgress",
  "WaitingOnClient",
  "Resolved",
  "Closed",
];

export const PORTAL_TICKET_STATUS_LABELS: Record<PortalTicketStatus, string> = {
  Open: "Open",
  InProgress: "In Progress",
  WaitingOnClient: "Waiting on Client",
  Resolved: "Resolved",
  Closed: "Closed",
};

export const PORTAL_TICKET_STATUS_TONE: Record<PortalTicketStatus, string> = {
  Open: "sky",
  InProgress: "amber",
  WaitingOnClient: "violet",
  Resolved: "emerald",
  Closed: "slate",
};

export const PORTAL_TICKET_CATEGORY_LABELS: Record<PortalTicketCategory, string> = {
  Bug: "Bug / Issue",
  ContentUpdate: "Content Update",
  TechnicalQuestion: "Technical Question",
  Billing: "Billing",
  Other: "Other",
};

// Static response-time guidance shown on a ticket, keyed by priority.
// Not yet tied to a real maintenance-plan SLA (phase 2) — a fixed estimate
// per priority level for now.
export const TICKET_PRIORITY_RESPONSE_TIME: Record<TicketPriority, string> = {
  Low: "within 3 business days",
  Medium: "within 1-2 business days",
  High: "within 1 business day",
  Urgent: "within a few hours",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  Upcoming: "Upcoming",
  InProgress: "In Progress",
  Completed: "Completed",
};

export const MILESTONE_STATUS_TONE: Record<MilestoneStatus, string> = {
  Upcoming: "slate",
  InProgress: "amber",
  Completed: "emerald",
};

export const MILESTONE_APPROVAL_LABELS: Record<MilestoneApprovalStatus, string> = {
  Pending: "Pending Review",
  Approved: "Approved",
  ChangesRequested: "Changes Requested",
};

// "Changes Requested" is the one state that needs staff action — it must
// read as an alert, not inherit a neutral milestone-status colour.
export const MILESTONE_APPROVAL_TONE: Record<MilestoneApprovalStatus, string> = {
  Pending: "slate",
  Approved: "emerald",
  ChangesRequested: "rose",
};

// Project statuses are single display-safe words, but pages should still
// render them via Badge with these tones instead of plain text.
export const PROJECT_STATUS_TONE: Record<ProjectStatus, string> = {
  Discovery: "sky",
  Design: "violet",
  Development: "amber",
  Testing: "indigo",
  Deployed: "emerald",
  Maintenance: "teal",
};

export function projectProgress(project: Pick<Project, "milestones">): number {
  if (project.milestones.length === 0) return 0;
  const completed = project.milestones.filter((m) => m.status === "Completed").length;
  return Math.round((completed / project.milestones.length) * 100);
}

// -----------------------------------------------
// Client Portal (Phase 2: services, invoices/payment, suggestions)
// -----------------------------------------------

export type ServiceType = "Domain" | "Hosting" | "SSL" | "Email" | "Other";
export type InvoiceStatus = "Unpaid" | "Paid" | "Overdue" | "Void";
export type InvoiceSourceType = "ChangeRequest" | "Suggestion" | "Manual";
export type SuggestionCategory = "SEO" | "Performance" | "Security" | "Feature" | "Design" | "Conversion" | "Other";
export type SuggestionPriority = "Low" | "Medium" | "High";
export type SuggestionStatus = "Proposed" | "Approved" | "Snoozed" | "Declined" | "InProgress" | "Completed";

export interface Service {
  id: number;
  clientId: number;
  type: ServiceType;
  provider: string;
  planName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  clientId: number;
  sourceType: InvoiceSourceType;
  sourceId: number | null;
  description: string;
  amountExGst: string;
  gstAmount: string;
  totalAmount: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Suggestion {
  id: number;
  clientId: number;
  projectId: number | null;
  title: string;
  category: SuggestionCategory;
  description: string;
  expectedBenefit: string;
  priority: SuggestionPriority;
  estimatedCost: string;
  estimatedTime: string;
  includedInPlan: boolean;
  status: SuggestionStatus;
  snoozeUntil: string | null;
  declineReason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const SERVICE_TYPES: ServiceType[] = ["Domain", "Hosting", "SSL", "Email", "Other"];

export const SUGGESTION_CATEGORIES: SuggestionCategory[] = ["SEO", "Performance", "Security", "Feature", "Design", "Conversion", "Other"];

export const SUGGESTION_STATUS_LABELS: Record<SuggestionStatus, string> = {
  Proposed: "New",
  Approved: "Approved",
  Snoozed: "Maybe Later",
  Declined: "Declined",
  InProgress: "In Progress",
  Completed: "Completed",
};

export const SUGGESTION_STATUS_TONE: Record<SuggestionStatus, string> = {
  Proposed: "sky",
  Approved: "emerald",
  Snoozed: "violet",
  Declined: "rose",
  InProgress: "amber",
  Completed: "slate",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  Unpaid: "Unpaid",
  Paid: "Paid",
  Overdue: "Overdue",
  Void: "Void",
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, string> = {
  Unpaid: "amber",
  Paid: "emerald",
  Overdue: "rose",
  Void: "slate",
};

// GST is fixed at 10% (AUD). Money is stored/passed as decimal strings
// (matching Client.amountPaid/totalAmount's convention) — this only
// formats for display, it never does the arithmetic (that's server-side,
// see src/lib/invoices.ts).
export function formatAUD(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  // "—" rather than "$0.00" — a fake zero hides bad stored data.
  if (Number.isNaN(n)) return "—";
  return `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Fixed en-AU dates so US-locale browsers don't render month/day dates next
// to AUD amounts. Returns "—" for missing/invalid input.
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(d)}, ${d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}`;
}

// -----------------------------------------------
// Notifications (in-app inbox — the bell in the top bar)
// -----------------------------------------------

// What happened. Kept as a union rather than free text so the bell can pick
// an icon per kind, and so a typo'd type can't silently create a category
// nothing renders. Values are validated in src/lib/notify.ts callers.
export type NotificationType =
  | "TaskAssigned"
  | "TicketAssigned"
  | "TicketReply"
  | "ClientMessage"
  | "SuggestionStatus"
  | "ChangeRequestSubmitted"
  | "ChangeRequestStatus"
  | "InvoicePaid"
  | "EnquiryReceived"
  | "ClientSignup";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

// Emoji per kind — matches the nav tab icons in Shell.tsx so a notification
// visually points at the section it belongs to.
export const NOTIFICATION_ICON: Record<NotificationType, string> = {
  TaskAssigned: "\u2705",
  TicketAssigned: "\uD83C\uDFAB",
  TicketReply: "\uD83D\uDCAC",
  ClientMessage: "\uD83D\uDCAC",
  SuggestionStatus: "\uD83D\uDCA1",
  ChangeRequestSubmitted: "\uD83D\uDCDD",
  ChangeRequestStatus: "\uD83D\uDCDD",
  InvoicePaid: "\uD83E\uDDFE",
  EnquiryReceived: "\uD83D\uDCE8",
  ClientSignup: "\uD83D\uDC64",
};

// Coarse relative time for the notification list. Anything older than a
// week falls back to the absolute date — "9 days ago" is less useful than
// the day itself.
export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

// -----------------------------------------------
// Public website (apps/web) submissions
// -----------------------------------------------

export type EnquiryType = "Contact" | "Quote";
export type EnquiryStatus = "New" | "Contacted" | "Converted" | "Archived";

export const ENQUIRY_TYPES: readonly EnquiryType[] = ["Contact", "Quote"];
export const ENQUIRY_STATUSES: readonly EnquiryStatus[] = [
  "New",
  "Contacted",
  "Converted",
  "Archived",
];

export const ENQUIRY_STATUS_TONE: Record<EnquiryStatus, string> = {
  New: "sky",
  Contacted: "amber",
  Converted: "emerald",
  Archived: "slate",
};

export const ENQUIRY_TYPE_TONE: Record<EnquiryType, string> = {
  Contact: "slate",
  Quote: "violet",
};

export interface Enquiry {
  id: number;
  type: EnquiryType;
  name: string;
  business: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  message: string;
  status: EnquiryStatus;
  convertedClientId: number | null;
  createdAt: string;
  updatedAt: string;
}
