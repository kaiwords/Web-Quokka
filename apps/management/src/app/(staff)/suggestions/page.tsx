"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import NewSuggestionForm from "@/components/NewSuggestionForm";
import { useCurrentUser } from "@/components/layout/Shell";
import { fetchJson } from "@/lib/clientApi";
import { SUGGESTION_STATUS_LABELS, SUGGESTION_STATUS_TONE, formatAUD, formatDate, type Suggestion } from "@/types";

interface Row extends Suggestion {
  client: { id: number; name: string; company: string } | null;
}

export default function StaffSuggestionsPage() {
  // null = never loaded (initial spinner); [] = loaded, empty.
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { user, loaded: userLoaded } = useCurrentUser();
  // Guards against out-of-order responses when the filter changes quickly.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const { data, error } = await fetchJson<Row[]>(`/api/suggestions?${params}`);
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Client Portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Suggestions</h1>
          </div>
          {userLoaded && user?.isAdmin && (
            <Button onClick={() => setShowForm((s) => !s)}>+ New suggestion</Button>
          )}
        </div>

        {showForm && userLoaded && user?.isAdmin && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">Suggest something to a business</h2>
            <p className="mt-1 mb-4 text-xs text-slate-500">
              The business sees it in their portal and can approve (then pay), snooze, decline, or ask a question.
            </p>
            <NewSuggestionForm
              onCreated={() => {
                setShowForm(false);
                load();
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All statuses</option>
            {Object.entries(SUGGESTION_STATUS_LABELS).map(([k, v]) => (
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
              No suggestions match this filter.{" "}
              <button onClick={() => setStatus("")} className="text-xs text-slate-400 underline hover:text-slate-200">
                Clear filter
              </button>
            </p>
          ) : (
            <p className="text-sm text-slate-500">No suggestions posted yet.</p>
          )
        ) : (
          <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {rows.map((s) => (
              <Link key={s.id} href={`/suggestions/${s.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-800/40 transition">
                <div>
                  <p className="text-sm text-slate-200">{s.title}</p>
                  <p className="text-xs text-slate-500">
                    {s.client?.company || s.client?.name || "Unknown business"} · {s.category} ·{" "}
                    {s.includedInPlan ? "Included in plan" : s.estimatedCost ? formatAUD(s.estimatedCost) : "No cost set"} · {formatDate(s.createdAt)}
                  </p>
                </div>
                <Badge label={SUGGESTION_STATUS_LABELS[s.status]} tone={SUGGESTION_STATUS_TONE[s.status]} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
