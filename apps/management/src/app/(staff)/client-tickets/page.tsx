"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fetchJson } from "@/lib/clientApi";
import { PORTAL_TICKET_STATUS_LABELS, PORTAL_TICKET_STATUS_TONE, TICKET_PRIORITY_TONE, formatDate, type PortalTicketStatus } from "@/types";

interface Row {
  id: number;
  title: string;
  priority: string;
  status: string;
  assignedTo: string;
  createdAt: string;
  client: { id: number; name: string; company: string } | null;
}

export default function ClientTicketsPage() {
  // null = never loaded (initial spinner); [] = loaded, empty.
  const [tickets, setTickets] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  // Guards against out-of-order responses when the filter changes quickly.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const { data, error } = await fetchJson<Row[]>(`/api/client-tickets?${params}`);
    if (requestId !== requestIdRef.current) return; // stale response — a newer request is in flight
    if (error) {
      setLoadError(error);
    } else {
      setTickets(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Client Portal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Portal support tickets</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All statuses</option>
            {Object.entries(PORTAL_TICKET_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {loading && tickets !== null && (
            <span aria-live="polite" className="text-xs text-slate-500">
              Loading…
            </span>
          )}
        </div>

        {loadError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-sm text-rose-300">{loadError}</p>
            <Button variant="secondary" onClick={load}>
              Retry
            </Button>
          </div>
        ) : tickets === null ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : tickets.length === 0 ? (
          status ? (
            <p className="text-sm text-slate-500">
              No portal tickets match this filter.{" "}
              <button onClick={() => setStatus("")} className="text-xs text-slate-400 underline hover:text-slate-200">
                Clear filter
              </button>
            </p>
          ) : (
            <p className="text-sm text-slate-500">No portal tickets yet.</p>
          )
        ) : (
          <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {tickets.map((t) => (
              <Link key={t.id} href={`/client-tickets/${t.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-800/40 transition">
                <div>
                  <p className="text-sm text-slate-200">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.client?.company || t.client?.name || "Unknown business"} ·{" "}
                    {t.assignedTo && t.assignedTo !== "Unassigned" ? `Assigned to ${t.assignedTo}` : "Unassigned"} · {formatDate(t.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={t.priority} tone={TICKET_PRIORITY_TONE[t.priority as keyof typeof TICKET_PRIORITY_TONE] ?? "slate"} />
                  <Badge label={PORTAL_TICKET_STATUS_LABELS[t.status as PortalTicketStatus] ?? t.status} tone={PORTAL_TICKET_STATUS_TONE[t.status as PortalTicketStatus] ?? "slate"} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
