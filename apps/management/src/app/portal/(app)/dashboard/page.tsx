"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton, { portalButtonClasses } from "@/components/portal/ui/PortalButton";
import { usePortalUser, canAct } from "@/components/portal/PortalShell";
import { fetchJson } from "@/lib/clientApi";
import { PROJECT_STATUS_TONE, formatAUD } from "@/types";

// Project-status badge tone — the SAME mapping is used on the projects list
// and project detail pages (keep the three copies in sync; see report note
// about lifting it into a shared module). Derived from PROJECT_STATUS_TONE,
// except "indigo" (Testing), which PortalBadge doesn't have — sky is the
// closest portal tone.
function projectStatusTone(status: string): string {
  const tone = PROJECT_STATUS_TONE[status as keyof typeof PROJECT_STATUS_TONE];
  return tone === "indigo" ? "sky" : (tone ?? "slate");
}

interface ActiveProject {
  id: number;
  name: string;
  status: string;
  progress: number;
}

interface ActivityItem {
  type: "ticket" | "changeRequest" | "projectUpdate" | "suggestion";
  id: number;
  title: string;
  status?: string;
  projectId?: number;
  at: string;
}

interface DashboardStats {
  activeProjects: ActiveProject[];
  openTicketCount: number;
  openChangeRequestCount: number;
  unpaidInvoiceCount: number;
  unpaidInvoiceTotal: string;
  newSuggestionCount: number;
  recentActivity: ActivityItem[];
}

// Suggestions carry a status — phrase the line accordingly instead of
// labelling every one "New suggestion".
function suggestionLabel(item: ActivityItem): string {
  switch (item.status) {
    case "Proposed":
      return `New suggestion: ${item.title}`;
    case "Approved":
      return `Suggestion approved: ${item.title}`;
    case "InProgress":
      return `Suggestion in progress: ${item.title}`;
    case "Completed":
      return `Suggestion completed: ${item.title}`;
    case "Declined":
      return `Suggestion declined: ${item.title}`;
    default:
      return `Suggestion: ${item.title}`;
  }
}

function activityLine(item: ActivityItem): { href: string; label: string } {
  if (item.type === "ticket") return { href: `/portal/tickets/${item.id}`, label: `Ticket: ${item.title}` };
  if (item.type === "changeRequest") return { href: `/portal/change-requests/${item.id}`, label: `Change request: ${item.title}` };
  if (item.type === "suggestion") return { href: `/portal/suggestions/${item.id}`, label: suggestionLabel(item) };
  return { href: `/portal/projects/${item.projectId}`, label: `Project update: ${item.title}` };
}

export default function PortalDashboardPage() {
  const { user, loaded } = usePortalUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // setState only inside the promise callback — never synchronously in the
  // effect that calls this on mount (react-hooks/set-state-in-effect).
  const load = useCallback(() => {
    return fetchJson<DashboardStats>("/api/portal/dashboard/stats").then((res) => {
      setStats(res.data);
      setError(res.error);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setLoading(true);
    void load();
  }

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "";
  const statCardClasses = "rounded-2xl border border-sand-200 bg-white p-5 block hover:border-teal-400 transition";

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-sand-900">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
        </div>

        {loading ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-sand-200 bg-white p-5">
                  <div className="h-3 w-24 rounded bg-sand-100 animate-pulse" />
                  <div className="mt-4 h-8 w-10 rounded bg-sand-100 animate-pulse" />
                </div>
              ))}
            </div>
            <p className="text-sm text-sand-600">Loading your dashboard...</p>
          </>
        ) : error || !stats ? (
          <div className="rounded-2xl border border-coral-500/30 bg-white p-5">
            <p className="text-sm text-coral-600">{error ?? "Something went wrong loading this."}</p>
            <PortalButton variant="secondary" className="mt-3" onClick={retry}>
              Try again
            </PortalButton>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Link href="/portal/projects" className={statCardClasses}>
                <p className="text-xs uppercase tracking-[0.18em] text-sand-500">Active Projects</p>
                <p className="mt-3 text-3xl font-black text-sand-900">{stats.activeProjects.length}</p>
              </Link>
              <Link href="/portal/tickets" className={statCardClasses}>
                <p className="text-xs uppercase tracking-[0.18em] text-sand-500">Open Tickets</p>
                <p className="mt-3 text-3xl font-black text-sand-900">{stats.openTicketCount}</p>
              </Link>
              <Link href="/portal/change-requests" className={statCardClasses}>
                <p className="text-xs uppercase tracking-[0.18em] text-sand-500">Open Change Requests</p>
                <p className="mt-3 text-3xl font-black text-sand-900">{stats.openChangeRequestCount}</p>
              </Link>
              <Link href="/portal/invoices" className={statCardClasses}>
                <p className="text-xs uppercase tracking-[0.18em] text-sand-500">Unpaid Invoices</p>
                <p className="mt-3 text-3xl font-black text-sand-900">{stats.unpaidInvoiceCount}</p>
                {stats.unpaidInvoiceCount > 0 && <p className="text-xs text-coral-600">{formatAUD(stats.unpaidInvoiceTotal)} due</p>}
              </Link>
              <Link href="/portal/suggestions" className={statCardClasses}>
                <p className="text-xs uppercase tracking-[0.18em] text-sand-500">New Suggestions</p>
                <p className="mt-3 text-3xl font-black text-sand-900">{stats.newSuggestionCount}</p>
              </Link>
            </div>

            {loaded &&
              (canAct(user) ? (
                <div className="flex flex-wrap gap-3">
                  <Link href="/portal/tickets/new" className={portalButtonClasses("primary")}>
                    Raise a Ticket
                  </Link>
                  <Link href="/portal/change-requests/new" className={portalButtonClasses("secondary")}>
                    Request a Change
                  </Link>
                  {stats.unpaidInvoiceCount > 0 && (
                    <Link href="/portal/invoices" className={portalButtonClasses("secondary")}>
                      Pay Invoice
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-xs text-sand-500">You have view-only access — an Owner or Manager can raise tickets and requests.</p>
              ))}

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-sand-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-sand-900">Your projects</h2>
                <div className="mt-4 space-y-4">
                  {stats.activeProjects.length === 0 && <p className="text-xs text-sand-500">No projects yet.</p>}
                  {stats.activeProjects.map((p) => (
                    <Link key={p.id} href={`/portal/projects/${p.id}`} className="block">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-sand-800">{p.name}</p>
                        <PortalBadge label={p.status} tone={projectStatusTone(p.status)} />
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-sand-100 overflow-hidden">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${p.progress}%` }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-sand-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-sand-900">Recent activity</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {stats.recentActivity.length === 0 && <li className="text-xs text-sand-500">No recent activity yet.</li>}
                  {stats.recentActivity.map((item) => {
                    const { href, label } = activityLine(item);
                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <Link href={href} className="text-sand-700 hover:text-teal-700">
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
