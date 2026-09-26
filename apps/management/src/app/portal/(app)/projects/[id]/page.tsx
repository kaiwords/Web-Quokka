"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton, { portalButtonClasses } from "@/components/portal/ui/PortalButton";
import { usePortalUser, canAct } from "@/components/portal/PortalShell";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import {
  MILESTONE_APPROVAL_LABELS,
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_TONE,
  PROJECT_STATUS_TONE,
  formatDate,
  formatDateTime,
  formatFileSize,
  projectProgress,
  type Milestone,
  type MilestoneApprovalStatus,
  type ProjectUpdate,
} from "@/types";

// Project-status badge tone — the SAME mapping is used on the dashboard and
// projects list pages (keep the three copies in sync; see report note about
// lifting it into a shared module). Derived from PROJECT_STATUS_TONE, except
// "indigo" (Testing), which PortalBadge doesn't have — sky is the closest
// portal tone.
function projectStatusTone(status: string): string {
  const tone = PROJECT_STATUS_TONE[status as keyof typeof PROJECT_STATUS_TONE];
  return tone === "indigo" ? "sky" : (tone ?? "slate");
}

// Client-facing approval tones: "Changes Requested" is the client's own
// request, so amber (in progress) rather than the staff alert rose.
const APPROVAL_TONE: Record<MilestoneApprovalStatus, string> = {
  Pending: "slate",
  Approved: "emerald",
  ChangesRequested: "amber",
};

interface ProjectFile {
  id: number;
  originalName: string;
  size: number;
  category: string;
  createdAt: string;
}

interface ProjectDetail {
  id: number;
  name: string;
  status: string;
  stagingUrl: string;
  liveUrl: string;
  milestones: Milestone[];
  updates: ProjectUpdate[];
  documents: ProjectFile[];
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user, loaded } = usePortalUser();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(0);
  const [decisionComment, setDecisionComment] = useState<Record<number, string>>({});
  const [commentNeeded, setCommentNeeded] = useState<Record<number, boolean>>({});
  const [actingKey, setActingKey] = useState<string | null>(null);

  // setState only inside the promise callback — never synchronously in the
  // effect that calls this on mount (react-hooks/set-state-in-effect).
  // Calling it after a mutation refreshes in place without a loading flash.
  const load = useCallback(() => {
    return fetchJson<ProjectDetail>(`/api/portal/projects/${id}`).then((res) => {
      setProject(res.data);
      setError(res.error);
      setStatus(res.status);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setLoading(true);
    void load();
  }

  async function decide(m: Milestone, decision: "Approved" | "ChangesRequested") {
    const comment = (decisionComment[m.id] ?? "").trim();
    if (decision === "ChangesRequested" && !comment) {
      setCommentNeeded((c) => ({ ...c, [m.id]: true }));
      return;
    }
    const confirmed = await confirmAction(
      decision === "Approved"
        ? {
            title: "Approve this milestone?",
            message: `"${m.title}" will be marked as approved and the team notified.`,
            confirmLabel: "Approve",
            tone: "default",
          }
        : {
            title: "Request changes?",
            message: `We'll send your comment about "${m.title}" to the team.`,
            confirmLabel: "Request changes",
            tone: "default",
          }
    );
    if (!confirmed) return;

    setActingKey(`${m.id}:${decision}`);
    try {
      const { ok } = await mutate(
        `/api/portal/projects/${id}/milestones/${m.id}/approve`,
        { method: "POST", body: JSON.stringify({ decision, comment }) },
        { success: decision === "Approved" ? "Milestone approved — thank you!" : "Your change request has been sent to the team." }
      );
      if (ok) {
        setDecisionComment((c) => ({ ...c, [m.id]: "" }));
        await load();
      }
    } finally {
      setActingKey(null);
    }
  }

  const isActor = loaded && canAct(user);
  const progress = project ? projectProgress(project) : 0;

  return (
    <>
      <div className="space-y-6">
        <Link href="/portal/projects" className="inline-block text-xs text-teal-700 hover:underline">
          ← Back to projects
        </Link>

        {loading ? (
          <p className="text-sm text-sand-600">Loading...</p>
        ) : !project ? (
          status === 404 ? (
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <p className="text-sm text-sand-700">We couldn&apos;t find that project — it may no longer be shared with you.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-coral-500/30 bg-white p-5">
              <p className="text-sm text-coral-600">{error ?? "Something went wrong loading this project."}</p>
              <PortalButton variant="secondary" className="mt-3" onClick={retry}>
                Try again
              </PortalButton>
            </div>
          )
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Project</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-sand-900">{project.name}</h1>
              </div>
              <div className="flex gap-2">
                {project.stagingUrl && (
                  <a href={project.stagingUrl} target="_blank" rel="noopener noreferrer" className={portalButtonClasses("secondary")}>
                    Staging Preview
                  </a>
                )}
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={portalButtonClasses("primary")}>
                    Live Site
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <PortalBadge label={project.status} tone={projectStatusTone(project.status)} />
                <p className="text-xs text-sand-500">{progress}% complete</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-sand-100 overflow-hidden">
                <div className="h-full rounded-full bg-teal-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-sand-900">Milestones</h2>
              {project.milestones.length === 0 ? (
                <p className="mt-4 text-xs text-sand-500">No milestones yet.</p>
              ) : (
                <ol className="mt-4 space-y-4">
                  {project.milestones.map((m) => (
                    <li key={m.id} className="rounded-xl border border-sand-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-sand-800">{m.title}</p>
                        <div className="flex items-center gap-2">
                          {m.dueDate && <span className="text-xs text-sand-500">Due {formatDate(m.dueDate)}</span>}
                          <PortalBadge
                            label={MILESTONE_STATUS_LABELS[m.status] ?? m.status}
                            tone={MILESTONE_STATUS_TONE[m.status] ?? "slate"}
                          />
                        </div>
                      </div>

                      {m.tasks.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {m.tasks.map((t) => (
                            <li key={t.id} className="flex items-center gap-2 text-xs text-sand-600">
                              <span aria-hidden="true">{t.done ? "✅" : "⬜"}</span>
                              <span className="sr-only">{t.done ? "Done:" : "To do:"}</span>
                              <span className={t.done ? "line-through text-sand-400" : ""}>{t.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {m.status === "Completed" && (
                        <div className="mt-3 border-t border-sand-100 pt-3">
                          {m.approvalStatus === "Pending" && isActor ? (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-sand-700">Ready for your review</p>
                              <label htmlFor={`decision-comment-${m.id}`} className="sr-only">
                                Comments for milestone {m.title}
                              </label>
                              <textarea
                                id={`decision-comment-${m.id}`}
                                placeholder="Comments (required when requesting changes)"
                                value={decisionComment[m.id] || ""}
                                onChange={(e) => {
                                  setDecisionComment((c) => ({ ...c, [m.id]: e.target.value }));
                                  if (e.target.value.trim()) setCommentNeeded((c) => ({ ...c, [m.id]: false }));
                                }}
                                className="w-full rounded-lg border border-sand-200 px-3 py-1.5 text-xs text-sand-900 focus:border-teal-500 focus:outline-none"
                                rows={2}
                              />
                              {commentNeeded[m.id] && (
                                <p className="text-xs text-coral-600">Please add a brief comment so the team knows what to change.</p>
                              )}
                              <div className="flex gap-2">
                                <PortalButton
                                  loading={actingKey === `${m.id}:Approved`}
                                  disabled={actingKey !== null}
                                  onClick={() => void decide(m, "Approved")}
                                >
                                  Approve
                                </PortalButton>
                                <PortalButton
                                  variant="secondary"
                                  loading={actingKey === `${m.id}:ChangesRequested`}
                                  disabled={actingKey !== null}
                                  onClick={() => void decide(m, "ChangesRequested")}
                                >
                                  Request Changes
                                </PortalButton>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <PortalBadge
                                label={MILESTONE_APPROVAL_LABELS[m.approvalStatus] ?? m.approvalStatus}
                                tone={APPROVAL_TONE[m.approvalStatus] ?? "slate"}
                              />
                              {m.approvalComment && <p className="text-xs text-sand-500">&quot;{m.approvalComment}&quot;</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-sand-900">Updates</h2>
              {project.updates.length === 0 ? (
                <p className="mt-4 text-xs text-sand-500">No updates posted yet.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {project.updates.map((u) => (
                    <li key={u.id} className="border-b border-sand-100 pb-4 last:border-none last:pb-0">
                      <p className="text-sm text-sand-800 whitespace-pre-wrap">{u.body}</p>
                      {u.links.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {u.links.map((l, i) => (
                            <a key={i} href={l} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-700 hover:underline">
                              {l}
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-[11px] text-sand-400">
                        {u.postedBy} · {formatDateTime(u.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Nothing in the product attaches files to a project yet — hide the
                section entirely rather than showing a permanently empty box. */}
            {project.documents.length > 0 && (
              <div className="rounded-2xl border border-sand-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-sand-900">Files</h2>
                <ul className="mt-4 space-y-2">
                  {project.documents.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
                      <div>
                        <a href={`/api/portal/documents/${f.id}`} className="text-teal-700 hover:underline">
                          {f.originalName}
                        </a>
                        <span className="ml-2 text-xs text-sand-400">
                          {f.category} · {formatFileSize(f.size)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
