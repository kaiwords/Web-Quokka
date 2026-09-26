"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton from "@/components/portal/ui/PortalButton";
import { fetchJson } from "@/lib/clientApi";
import { PROJECT_STATUS_TONE, projectProgress, type Project } from "@/types";

// Project-status badge tone — the SAME mapping is used on the dashboard and
// project detail pages (keep the three copies in sync; see report note about
// lifting it into a shared module). Derived from PROJECT_STATUS_TONE, except
// "indigo" (Testing), which PortalBadge doesn't have — sky is the closest
// portal tone.
function projectStatusTone(status: string): string {
  const tone = PROJECT_STATUS_TONE[status as keyof typeof PROJECT_STATUS_TONE];
  return tone === "indigo" ? "sky" : (tone ?? "slate");
}

// The list API trims each project's milestones to {id, status} — only
// `status` is consumed here (via projectProgress).
type ProjectRow = Pick<Project, "id" | "name" | "status" | "milestones">;

export default function PortalProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // setState only inside the promise callback — never synchronously in the
  // effect that calls this on mount (react-hooks/set-state-in-effect).
  const load = useCallback(() => {
    return fetchJson<ProjectRow[]>("/api/portal/projects").then((res) => {
      setProjects(res.data ?? []);
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

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Projects</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-sand-900">Your projects</h1>
        </div>

        {loading ? (
          <p className="text-sm text-sand-600">Loading...</p>
        ) : error ? (
          <div className="rounded-2xl border border-coral-500/30 bg-white p-5">
            <p className="text-sm text-coral-600">{error}</p>
            <PortalButton variant="secondary" className="mt-3" onClick={retry}>
              Try again
            </PortalButton>
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-sand-500">No projects yet — check back once WebQuokka kicks things off. 🐾</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => {
              const progress = projectProgress(p);
              return (
                <Link key={p.id} href={`/portal/projects/${p.id}`} className="rounded-2xl border border-sand-200 bg-white p-5 block hover:border-teal-400 transition">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sand-900">{p.name}</p>
                    <PortalBadge label={p.status} tone={projectStatusTone(p.status)} />
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-sand-100 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-sand-500">{progress}% complete</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
