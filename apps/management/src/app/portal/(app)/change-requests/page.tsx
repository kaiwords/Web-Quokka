"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton, { portalButtonClasses } from "@/components/portal/ui/PortalButton";
import { canAct, usePortalUser } from "@/components/portal/PortalShell";
import { fetchJson } from "@/lib/clientApi";
import { CHANGE_REQUEST_STATUS_LABELS, CHANGE_REQUEST_STATUS_TONE, formatAUD, formatDate, type ChangeRequestStatus } from "@/types";

interface Row {
  id: number;
  title: string;
  status: string;
  includedInPlan: boolean;
  quoteAmount: string;
  createdAt: string;
}

export default function ChangeRequestsPage() {
  const { user, loaded } = usePortalUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetchJson<Row[]>("/api/portal/change-requests");
    setRows(res.data ?? []);
    setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setLoading(true);
    setError(null);
    void load();
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Requests</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-sand-900">Change Requests</h1>
          </div>
          {loaded && canAct(user) && (
            <Link href="/portal/change-requests/new" className={portalButtonClasses("primary")}>
              Request a Change
            </Link>
          )}
          {loaded && user && !canAct(user) && <span className="text-xs text-sand-400">View-only access</span>}
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
        ) : rows.length === 0 ? (
          <p className="text-sm text-sand-500">
            No change requests yet — when you&apos;d like something on your site tweaked or added, raise one here.
          </p>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-white divide-y divide-sand-100">
            {rows.map((r) => (
              <Link key={r.id} href={`/portal/change-requests/${r.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-sand-50 transition">
                <div>
                  <p className="text-sm font-medium text-sand-800">{r.title}</p>
                  <p className="text-xs text-sand-500">
                    {formatDate(r.createdAt)}
                    {r.quoteAmount && parseFloat(r.quoteAmount) > 0 && ` · Quoted ${formatAUD(r.quoteAmount)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.includedInPlan && <PortalBadge label="Included in plan" tone="emerald" />}
                  <PortalBadge
                    label={CHANGE_REQUEST_STATUS_LABELS[r.status as ChangeRequestStatus] ?? r.status}
                    tone={CHANGE_REQUEST_STATUS_TONE[r.status as ChangeRequestStatus] ?? "slate"}
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
