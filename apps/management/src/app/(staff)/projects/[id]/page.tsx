"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { useCurrentUser } from "@/components/layout/Shell";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_TONE,
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_TONE,
  MILESTONE_APPROVAL_LABELS,
  MILESTONE_APPROVAL_TONE,
  formatDate,
  formatDateTime,
  formatFileSize,
  type ProjectStatus,
  type MilestoneStatus,
  type MilestoneApprovalStatus,
} from "@/types";

interface ProjectTaskRow {
  id: number;
  title: string;
  done: boolean;
}

interface MilestoneRow {
  id: number;
  title: string;
  status: MilestoneStatus;
  dueDate: string | null;
  tasks: ProjectTaskRow[];
  approvalStatus: MilestoneApprovalStatus;
  approvalComment: string;
}

interface UpdateRow {
  id: number;
  body: string;
  postedBy: string;
  createdAt: string;
}

interface DocRow {
  id: number;
  originalName: string;
  size: number;
  category: string;
}

interface ProjectDetail {
  id: number;
  name: string;
  status: ProjectStatus;
  stagingUrl: string;
  liveUrl: string;
  client: { id: number; name: string; company: string };
  milestones: MilestoneRow[];
  updates: UpdateRow[];
  documents: DocRow[];
}

const MILESTONE_STATUS_OPTIONS: MilestoneStatus[] = ["Upcoming", "InProgress", "Completed"];

// Overdue = a due day strictly before today on a milestone that isn't completed.
function isOverdue(dueDate: string | null, status: MilestoneStatus): boolean {
  if (!dueDate || status === "Completed") return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return due.getTime() < startOfToday.getTime();
}

export default function StaffProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, loaded: userLoaded } = useCurrentUser();
  const isAdmin = userLoaded && !!user?.isAdmin;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [updateBody, setUpdateBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [editingDueDateId, setEditingDueDateId] = useState<number | null>(null);
  const [taskTitleByMilestone, setTaskTitleByMilestone] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    const res = await fetchJson<ProjectDetail>(`/api/projects/${params.id}`);
    if (res.status === 404) {
      setNotFound(true);
      setProject(null);
      setError(null);
    } else if (res.error) {
      setError(res.error);
    } else {
      setProject(res.data);
      setError(null);
      setNotFound(false);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function setProjectStatus(status: ProjectStatus) {
    if (!project || statusSaving || project.status === status) return;
    setStatusSaving(true);
    const { ok } = await mutate(
      `/api/projects/${params.id}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      { success: "Status updated" }
    );
    if (ok) await load();
    setStatusSaving(false);
  }

  async function saveUrl(field: "stagingUrl" | "liveUrl", value: string) {
    if (!project || value === project[field]) return;
    const { ok } = await mutate(
      `/api/projects/${params.id}`,
      { method: "PATCH", body: JSON.stringify({ [field]: value }) },
      { success: field === "stagingUrl" ? "Staging URL saved" : "Live URL saved" }
    );
    if (ok) load();
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    setAddingMilestone(true);
    const { ok } = await mutate(
      `/api/projects/${params.id}/milestones`,
      { method: "POST", body: JSON.stringify({ title: milestoneTitle }) },
      { success: "Milestone added" }
    );
    setAddingMilestone(false);
    if (ok) {
      setMilestoneTitle("");
      load();
    }
  }

  async function setMilestoneStatus(id: number, status: MilestoneStatus) {
    await mutate(`/api/milestones/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    // Refetch either way — a controlled <select> needs a re-render to snap
    // back when the server rejected the change.
    load();
  }

  async function saveMilestoneDueDate(m: MilestoneRow, value: string) {
    setEditingDueDateId(null);
    const next = value || null;
    const current = m.dueDate ? m.dueDate.slice(0, 10) : null;
    if (next === current) return;
    const { ok } = await mutate(`/api/milestones/${m.id}`, {
      method: "PATCH",
      body: JSON.stringify({ dueDate: next }),
    });
    if (ok) load();
  }

  async function deleteMilestone(m: MilestoneRow) {
    const confirmed = await confirmAction({
      title: "Delete this milestone?",
      message: `"${m.title}" and its deliverables will be permanently removed.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/milestones/${m.id}`,
      { method: "DELETE" },
      { success: "Milestone deleted" }
    );
    if (ok) load();
  }

  async function addProjectTask(milestoneId: number, e: React.FormEvent) {
    e.preventDefault();
    const title = taskTitleByMilestone[milestoneId];
    if (!title?.trim()) return;
    const { ok } = await mutate(`/api/milestones/${milestoneId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    if (ok) {
      setTaskTitleByMilestone((m) => ({ ...m, [milestoneId]: "" }));
      load();
    }
  }

  async function toggleProjectTask(id: number, done: boolean) {
    const { ok } = await mutate(`/api/project-tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ done }),
    });
    if (ok) load();
  }

  async function deleteProjectTask(t: ProjectTaskRow) {
    const confirmed = await confirmAction({
      title: "Delete this deliverable?",
      message: `"${t.title}" will be permanently removed.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/project-tasks/${t.id}`,
      { method: "DELETE" },
      { success: "Deliverable deleted" }
    );
    if (ok) load();
  }

  async function postUpdate() {
    if (!updateBody.trim() || posting) return;
    setPosting(true);
    const { ok } = await mutate(
      `/api/projects/${params.id}/updates`,
      { method: "POST", body: JSON.stringify({ body: updateBody }) },
      { success: "Update posted" }
    );
    setPosting(false);
    if (ok) {
      setUpdateBody("");
      load();
    }
  }

  if (loading) return <><p className="text-sm text-slate-400">Loading...</p></>;
  if (notFound) return <><p className="text-sm text-slate-400">Project not found.</p></>;
  if (error || !project)
    return (
      <>
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
          <p className="text-sm text-rose-300">{error ?? "Something went wrong loading this."}</p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => {
              setLoading(true);
              load();
            }}
          >
            Retry
          </Button>
        </div>
      </>
    );

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
            <Link href={`/clients/${project.client.id}`} className="hover:text-amber-300">
              {project.client.company || project.client.name}
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{project.name}</h1>
          {userLoaded && !isAdmin && (
            <p className="mt-1 text-xs text-slate-500">Only admins can edit project details.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Status</h2>
          {isAdmin ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {PROJECT_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setProjectStatus(s)}
                  disabled={project.status === s || statusSaving}
                  aria-pressed={project.status === s}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed ${
                    project.status === s
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                      : "border-slate-800 text-slate-500 hover:text-slate-300 disabled:opacity-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <Badge label={project.status} tone={PROJECT_STATUS_TONE[project.status]} />
            </div>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["stagingUrl", "liveUrl"] as const).map((field) => {
              const label = field === "stagingUrl" ? "Staging URL" : "Live URL";
              return isAdmin ? (
                <label key={field} className="text-xs text-slate-500">
                  {label}
                  <Input
                    type="url"
                    defaultValue={project[field]}
                    placeholder="https://"
                    onBlur={(e) => saveUrl(field, e.target.value)}
                    className="mt-1"
                  />
                </label>
              ) : (
                <div key={field} className="text-xs text-slate-500">
                  {label}
                  <p className="mt-1 text-sm break-all">
                    {project[field] ? (
                      <a
                        href={project[field]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:text-amber-300"
                      >
                        {project[field]}
                      </a>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Milestones</h2>
          <div className="mt-4 space-y-3">
            {project.milestones.length === 0 && (
              <p className="text-xs text-slate-500">
                {isAdmin ? "No milestones yet — add the first one below." : "No milestones yet."}
              </p>
            )}
            {project.milestones.map((m) => {
              const overdue = isOverdue(m.dueDate, m.status);
              return (
                <div key={m.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-slate-200">{m.title}</p>
                      {isAdmin ? (
                        editingDueDateId === m.id ? (
                          <input
                            type="date"
                            autoFocus
                            defaultValue={m.dueDate ? m.dueDate.slice(0, 10) : ""}
                            aria-label="Due date"
                            onBlur={(e) => saveMilestoneDueDate(m, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                              if (e.key === "Escape") setEditingDueDateId(null);
                            }}
                            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none scheme-dark"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingDueDateId(m.id)}
                            className={`text-xs transition ${
                              overdue
                                ? "text-rose-400 font-semibold hover:text-rose-300"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {m.dueDate
                              ? `Due ${formatDate(m.dueDate)}${overdue ? " · overdue" : ""}`
                              : "+ Due date"}
                          </button>
                        )
                      ) : (
                        m.dueDate && (
                          <span
                            className={`text-xs ${overdue ? "text-rose-400 font-semibold" : "text-slate-500"}`}
                          >
                            Due {formatDate(m.dueDate)}
                            {overdue && " · overdue"}
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <>
                          <select
                            value={m.status}
                            aria-label="Milestone status"
                            onChange={(e) => setMilestoneStatus(m.id, e.target.value as MilestoneStatus)}
                            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
                          >
                            {MILESTONE_STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {MILESTONE_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => deleteMilestone(m)}
                            aria-label={`Delete milestone "${m.title}"`}
                            className="text-xs text-slate-600 hover:text-rose-400 transition"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <Badge label={MILESTONE_STATUS_LABELS[m.status]} tone={MILESTONE_STATUS_TONE[m.status]} />
                      )}
                    </div>
                  </div>
                  {m.status === "Completed" && (
                    <Badge
                      className="mt-2"
                      label={MILESTONE_APPROVAL_LABELS[m.approvalStatus] ?? m.approvalStatus}
                      tone={MILESTONE_APPROVAL_TONE[m.approvalStatus] ?? "slate"}
                    />
                  )}
                  {m.approvalComment && <p className="mt-1 text-xs text-slate-500">&quot;{m.approvalComment}&quot;</p>}

                  <ul className="mt-2 space-y-1">
                    {m.tasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 text-xs">
                        <label
                          className={`flex flex-1 items-center gap-2 ${isAdmin ? "cursor-pointer" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={t.done}
                            disabled={!isAdmin}
                            onChange={(e) => toggleProjectTask(t.id, e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-amber-500"
                          />
                          <span className={t.done ? "text-slate-500 line-through" : "text-slate-300"}>
                            {t.title}
                          </span>
                        </label>
                        {isAdmin && (
                          <button
                            onClick={() => deleteProjectTask(t)}
                            aria-label={`Delete deliverable "${t.title}"`}
                            className="text-xs text-slate-600 hover:text-rose-400 transition"
                          >
                            ✕
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {isAdmin && (
                    <form onSubmit={(e) => addProjectTask(m.id, e)} className="mt-2 flex gap-2">
                      <input
                        placeholder="Add deliverable"
                        value={taskTitleByMilestone[m.id] || ""}
                        onChange={(e) => setTaskTitleByMilestone((tm) => ({ ...tm, [m.id]: e.target.value }))}
                        className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                      />
                      <button type="submit" className="text-xs text-amber-400 hover:text-amber-300">
                        Add
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
          {isAdmin && (
            <form onSubmit={addMilestone} className="mt-4 flex gap-2">
              <Input
                placeholder="New milestone title *"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" loading={addingMilestone}>
                Add milestone
              </Button>
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Updates</h2>
          <div className="mt-4 space-y-3">
            {project.updates.length === 0 && (
              <p className="text-xs text-slate-500">No updates posted yet.</p>
            )}
            {project.updates.map((u) => (
              <div key={u.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{u.body}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {u.postedBy} · {formatDateTime(u.createdAt)}
                </p>
              </div>
            ))}
          </div>
          {isAdmin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                postUpdate();
              }}
              className="mt-4 flex gap-2"
            >
              <textarea
                placeholder="Post an update to the client... (Ctrl+Enter to post)"
                value={updateBody}
                onChange={(e) => setUpdateBody(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    postUpdate();
                  }
                }}
                rows={2}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
              />
              <Button type="submit" loading={posting}>
                Post
              </Button>
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Files</h2>
          <div className="mt-4 space-y-2">
            {project.documents.length === 0 && <p className="text-xs text-slate-500">No files shared yet.</p>}
            {project.documents.map((d) => (
              <a key={d.id} href={`/api/documents/${d.id}`} className="block text-sm text-slate-200 hover:text-amber-400">
                📄 {d.originalName} <span className="text-xs text-slate-500">({formatFileSize(d.size)})</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
