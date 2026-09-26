"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton, { portalButtonClasses } from "@/components/portal/ui/PortalButton";
import { canAct, usePortalUser } from "@/components/portal/PortalShell";
import { fetchJson } from "@/lib/clientApi";
import {
  PORTAL_TICKET_STATUS_LABELS,
  PORTAL_TICKET_STATUS_TONE,
  TICKET_PRIORITY_TONE,
  formatDate,
  type PortalTicketStatus,
  type TicketPriority,
} from "@/types";

// A bare "Low" badge reads like a temperature — spell out what it refers to.
// (Candidate for @/types alongside TICKET_PRIORITY_TONE.)
const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  Low: "Low priority",
  Medium: "Medium priority",
  High: "High priority",
  Urgent: "Urgent",
};

interface TicketRow {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

export default function PortalTicketsPage() {
  const { user, loaded } = usePortalUser();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  // Monotonic id per request — a slow early response can't overwrite a
  // newer one after the user kept typing.
  const requestId = useRef(0);

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const load = useCallback(async () => {
    const rid = ++requestId.current;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    const res = await fetchJson<TicketRow[]>(`/api/portal/tickets?${params}`);
    if (rid !== requestId.current) return; // a newer request superseded this one
    setTickets(res.data ?? []);
    setError(res.error);
    setLoading(false);
  }, [status, debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setLoading(true);
    setError(null);
    void load();
  }

  const hasFilter = debouncedQ.trim() !== "" || status !== "";

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Support</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-sand-900">Tickets</h1>
          </div>
          {loaded && canAct(user) && (
            <Link href="/portal/tickets/new" className={portalButtonClasses("primary")}>
              Raise a Ticket
            </Link>
          )}
          {loaded && user && !canAct(user) && <span className="text-xs text-sand-400">View-only access</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            aria-label="Search tickets"
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-lg border border-sand-200 px-3 py-1.5 text-xs text-sand-900 focus:border-teal-500 focus:outline-none"
          />
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-sand-200 px-3 py-1.5 text-xs text-sand-900 focus:border-teal-500 focus:outline-none"
          >
            <option value="">All statuses</option>
            {Object.entries(PORTAL_TICKET_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-sand-600">Loading...</p>
        ) : error ? (
          <div className="rounded-2xl border border-coral-500/30 bg-coral-500/5 p-5">
            <p className="text-sm text-coral-600">{error}</p>
            <div className="mt-3">
              <PortalButton variant="secondary" onClick={retry}>
                Retry
              </PortalButton>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-sand-500">
            {hasFilter ? "No tickets match your search." : <>No tickets yet — everything&apos;s running smoothly! 🐾</>}
          </p>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-white divide-y divide-sand-100">
            {tickets.map((t) => (
              <Link key={t.id} href={`/portal/tickets/${t.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-sand-50 transition">
                <div>
                  <p className="text-sm font-medium text-sand-800">{t.title}</p>
                  <p className="text-xs text-sand-500">{formatDate(t.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PortalBadge
                    label={TICKET_PRIORITY_LABELS[t.priority as TicketPriority] ?? t.priority}
                    tone={TICKET_PRIORITY_TONE[t.priority as TicketPriority] ?? "slate"}
                  />
                  <PortalBadge
                    label={PORTAL_TICKET_STATUS_LABELS[t.status as PortalTicketStatus] ?? t.status}
                    tone={PORTAL_TICKET_STATUS_TONE[t.status as PortalTicketStatus] ?? "slate"}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
