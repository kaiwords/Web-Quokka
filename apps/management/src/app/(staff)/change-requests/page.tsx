"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fetchJson } from "@/lib/clientApi";
import { CHANGE_REQUEST_STATUS_LABELS, CHANGE_REQUEST_STATUS_TONE, formatDate, type ChangeRequestStatus } from "@/types";

interface Row {
  id: number;
  title: string;
  status: string;
  includedInPlan: boolean;
  createdAt: string;
  client: { id: number; name: string; company: string } | null;
}

export default function StaffChangeRequestsPage() {
  // null = never loaded (initial spinner); [] = loaded, empty.
  const [rows, setRows] = useState<Row[] | null>(null);
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
    const { data, error } = await fetchJson<Row[]>(`/api/change-requests?${params}`);
    if (requestId !== requestIdRef.current) return; // stale response — a newer request is in flight
    if (error) {
      setLoadError(error);
    } else {
      setRows(Array.isArray(data) ? data : []);
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
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Change requests</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All statuses</option>
            {Object.entries(CHANGE_REQUEST_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {loading && rows !== null && (
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
        ) : rows === null ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : rows.length === 0 ? (
          status ? (
            <p className="text-sm text-slate-500">
              No change requests match this filter.{" "}
              <button onClick={() => setStatus("")} className="text-xs text-slate-400 underline hover:text-slate-200">
                Clear filter
              </button>
            </p>
          ) : (
            <p className="text-sm text-slate-500">No change requests yet.</p>
          )
        ) : (
          <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {rows.map((r) => (
              <Link key={r.id} href={`/change-requests/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-800/40 transition">
                <div>
                  <p className="text-sm text-slate-200">{r.title}</p>
                  <p className="text-xs text-slate-500">
                    {r.client?.company || r.client?.name || "Unknown business"} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.includedInPlan && <Badge label="Included in plan" tone="emerald" />}
                  <Badge label={CHANGE_REQUEST_STATUS_LABELS[r.status as ChangeRequestStatus] ?? r.status} tone={CHANGE_REQUEST_STATUS_TONE[r.status as ChangeRequestStatus] ?? "slate"} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
