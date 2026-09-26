"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import AssigneeSelect from "@/components/ui/AssigneeSelect";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { useCurrentUser } from "@/components/layout/Shell";
import {
  CLIENT_STAGE_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
  formatDate,
  isTaskOpen,
  type ClientStage,
  type TaskStatus,
} from "@/types";

interface TaskWithClient {
  id: number;
  clientId: number;
  title: string;
  assignee: string;
  assigneeUserId: number | null;
  status: TaskStatus;
  dueDate: string | null;
  client: { id: number; name: string };
}

interface ClientOption {
  id: number;
  name: string;
}

const CHIP_BASE = "rounded-lg px-3 py-1.5 border transition";
const CHIP_ACTIVE = "bg-amber-500/15 text-amber-400 border-amber-500/50";
const CHIP_INACTIVE = "text-slate-400 hover:text-slate-200 border-transparent";

// Overdue = a due day strictly before today, on a task still open. A done or
// cancelled task can't run late — it's finished with either way.
function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || !isTaskOpen(status)) return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return due.getTime() < startOfToday.getTime();
}

function TasksPageInner() {
  const searchParams = useSearchParams();
  const stage = searchParams.get("stage") as ClientStage | null;
  const { user, loaded: userLoaded } = useCurrentUser();
  const isAdmin = userLoaded && !!user?.isAdmin;

  const [tasks, setTasks] = useState<TaskWithClient[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showClosed, setShowClosed] = useState(false);
  const [taskForm, setTaskForm] = useState<{ clientId: string; title: string; assigneeUserId: number | null }>({
    clientId: "",
    title: "",
    assigneeUserId: null,
  });
  const [creating, setCreating] = useState(false);
  const [editingDueDateId, setEditingDueDateId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    // The status chips are explicit about what they want, so only the "All"
    // view needs the open-work default applied on top.
    else if (!showClosed) params.set("open", "true");
    if (stage) params.set("stage", stage);
    const res = await fetchJson<TaskWithClient[]>(`/api/tasks?${params.toString()}`);
    setTasks(Array.isArray(res.data) ? res.data : []);
    setError(res.error);
    setLoading(false);
  }, [statusFilter, showClosed, stage]);

  useEffect(() => {
    load();
  }, [load]);

  // The create-form client dropdown only needs fetching once, not on every
  // filter change.
  useEffect(() => {
    fetchJson<ClientOption[]>("/api/clients?group=workingon").then((res) => {
      setClients(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  async function setStatus(taskId: number, status: TaskStatus) {
    await mutate(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    // Refetch either way — a controlled <select> needs a re-render to snap
    // back when the server rejected the change.
    load();
  }

  async function reassignTask(taskId: number, assigneeUserId: number | null) {
    const { ok } = await mutate(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeUserId }),
    });
    if (ok) load();
  }

  async function saveDueDate(task: TaskWithClient, value: string) {
    setEditingDueDateId(null);
    const next = value || null;
    const current = task.dueDate ? task.dueDate.slice(0, 10) : null;
    if (next === current) return;
    const { ok } = await mutate(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ dueDate: next }),
    });
    if (ok) load();
  }

  async function deleteTask(task: TaskWithClient) {
    const confirmed = await confirmAction({
      title: "Delete this task?",
      message: `"${task.title}" will be permanently removed for ${task.client.name}.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/tasks/${task.id}`,
      { method: "DELETE" },
      { success: "Task deleted" }
    );
    if (ok) load();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskForm.clientId || !taskForm.title.trim()) return;
    setCreating(true);
    const { ok } = await mutate(
      "/api/tasks",
      { method: "POST", body: JSON.stringify(taskForm) },
      { success: "Task added" }
    );
    setCreating(false);
    if (ok) {
      setTaskForm({ clientId: "", title: "", assigneeUserId: null });
      load();
    }
  }

  // Group by client id — different clients can share a name, and the group
  // header links to one specific client page.
  const grouped = new Map<number, { client: { id: number; name: string }; tasks: TaskWithClient[] }>();
  for (const task of tasks) {
    const entry = grouped.get(task.client.id) ?? { client: task.client, tasks: [] };
    entry.tasks.push(task);
    grouped.set(task.client.id, entry);
  }

  const filterActive = Boolean(stage) || statusFilter !== "all";

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Task Follow-up</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {stage ? `Tasks — ${CLIENT_STAGE_LABELS[stage] ?? stage}` : "What needs to be done"}
          </h1>
        </div>

        {stage && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
            <span className="text-amber-400">
              Filtered by stage: {CLIENT_STAGE_LABELS[stage] ?? stage}
            </span>
            <Link href="/tasks" className="text-xs text-slate-400 hover:text-slate-200 underline">
              Clear filter
            </Link>
          </div>
        )}

        <form
          onSubmit={addTask}
          className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:grid-cols-4"
        >
          <Select
            required
            aria-label="Client"
            value={taskForm.clientId}
            onChange={(e) => setTaskForm({ ...taskForm, clientId: e.target.value })}
          >
            <option value="">Select client *</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Task *"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            className={isAdmin ? "sm:col-span-2" : "sm:col-span-3"}
          />
          {isAdmin && (
            <AssigneeSelect
              aria-label="Assign to"
              value={taskForm.assigneeUserId}
              onChange={(assigneeUserId) => setTaskForm({ ...taskForm, assigneeUserId })}
            />
          )}
          <Button type="submit" loading={creating} className="w-full sm:w-auto">
            Add task
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <button
            onClick={() => setStatusFilter("all")}
            aria-pressed={statusFilter === "all"}
            className={`${CHIP_BASE} ${statusFilter === "all" ? CHIP_ACTIVE : CHIP_INACTIVE}`}
          >
            All
          </button>
          {TASK_STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              aria-pressed={statusFilter === st}
              className={`${CHIP_BASE} ${statusFilter === st ? CHIP_ACTIVE : CHIP_INACTIVE}`}
            >
              {TASK_STATUS_LABELS[st]}
            </button>
          ))}
          {statusFilter === "all" && (
            <label className="ml-auto flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                checked={showClosed}
                onChange={(e) => setShowClosed(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-amber-500"
              />
              Show done &amp; cancelled
            </label>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
            <p className="text-sm text-rose-300">{error}</p>
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
        ) : grouped.size === 0 ? (
          filterActive ? (
            <p className="text-sm text-slate-500">
              No tasks match this filter.{" "}
              <Link
                href="/tasks"
                onClick={() => setStatusFilter("all")}
                className="text-amber-400 hover:text-amber-300 underline"
              >
                Clear filter
              </Link>
            </p>
          ) : (
            <p className="text-sm text-slate-500">Nothing to follow up on. 🎉</p>
          )
        ) : (
          <div className="space-y-4">
            {[...grouped.values()].map(({ client, tasks: clientTasks }) => (
              <div key={client.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <Link
                  href={`/clients/${client.id}`}
                  className="text-sm font-semibold text-white hover:text-amber-400"
                >
                  {client.name}
                </Link>
                <div className="mt-3 space-y-2">
                  {clientTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    const closed = !isTaskOpen(task.status);
                    return (
                      <div
                        key={task.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`text-sm ${closed ? "text-slate-500 line-through" : "text-slate-200"}`}>
                            {task.title}
                          </span>
                          {isAdmin ? (
                            <span className="w-36 shrink-0">
                              <AssigneeSelect
                                aria-label={`Assignee for ${task.title}`}
                                value={task.assigneeUserId}
                                onChange={(userId) => reassignTask(task.id, userId)}
                              />
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">· {task.assignee}</span>
                          )}
                          {editingDueDateId === task.id ? (
                            <input
                              type="date"
                              autoFocus
                              defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                              aria-label="Due date"
                              onBlur={(e) => saveDueDate(task, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                                if (e.key === "Escape") setEditingDueDateId(null);
                              }}
                              className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none scheme-dark"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingDueDateId(task.id)}
                              className={`text-xs transition ${
                                overdue
                                  ? "text-rose-400 font-semibold hover:text-rose-300"
                                  : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {task.dueDate
                                ? `Due ${formatDate(task.dueDate)}${overdue ? " · overdue" : ""}`
                                : "+ Due date"}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={task.status}
                            aria-label={`Status of "${task.title}"`}
                            onChange={(e) => setStatus(task.id, e.target.value as TaskStatus)}
                            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
                          >
                            {TASK_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {TASK_STATUS_LABELS[st]}
                              </option>
                            ))}
                          </select>
                          <Badge label={TASK_STATUS_LABELS[task.status]} tone={TASK_STATUS_TONE[task.status]} />
                          <button
                            onClick={() => deleteTask(task)}
                            aria-label={`Delete task "${task.title}"`}
                            className="text-xs text-slate-600 hover:text-rose-400 transition"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageInner />
    </Suspense>
  );
}
