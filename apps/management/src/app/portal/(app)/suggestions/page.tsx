"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton from "@/components/portal/ui/PortalButton";
import { fetchJson } from "@/lib/clientApi";
import {
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUS_TONE,
  TICKET_PRIORITY_TONE,
  formatAUD,
  formatDate,
  type Suggestion,
  type SuggestionPriority,
} from "@/types";

// A bare "Low" badge reads like a temperature — spell out what it refers to.
const PRIORITY_LABELS: Record<SuggestionPriority, string> = {
  Low: "Low priority",
  Medium: "Medium priority",
  High: "High priority",
};

export default function PortalSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetchJson<Suggestion[]>("/api/portal/suggestions");
    setSuggestions(res.data ?? []);
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
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Suggestions</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-sand-900">Recommendations from Web Quokka</h1>
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
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-sand-500">No suggestions yet — everything&apos;s looking good! 🐾</p>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-white divide-y divide-sand-100">
            {suggestions.map((s) => (
              <Link key={s.id} href={`/portal/suggestions/${s.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-sand-50 transition">
                <div>
                  <p className="text-sm font-medium text-sand-800">{s.title}</p>
                  <p className="text-xs text-sand-500">
                    {s.category} · {formatDate(s.createdAt)} ·{" "}
                    {s.includedInPlan
                      ? "Included in plan"
                      : s.estimatedCost && parseFloat(s.estimatedCost) > 0
                        ? formatAUD(s.estimatedCost)
                        : "Cost TBC"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.priority && (
                    <PortalBadge label={PRIORITY_LABELS[s.priority] ?? s.priority} tone={TICKET_PRIORITY_TONE[s.priority] ?? "slate"} />
                  )}
                  <PortalBadge label={SUGGESTION_STATUS_LABELS[s.status] ?? s.status} tone={SUGGESTION_STATUS_TONE[s.status] ?? "slate"} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
