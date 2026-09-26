"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fetchJson } from "@/lib/clientApi";
import {
  CLIENT_STAGE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
  type DashboardStats,
  type TaskStatus,
} from "@/types";

interface OpenTask {
  id: number;
  title: string;
  assignee: string;
  status: TaskStatus;
  client: { id: number; name: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [openTasks, setOpenTasks] = useState<OpenTask[]>([]);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [statsRes, tasksRes] = await Promise.all([
      fetchJson<DashboardStats>("/api/dashboard/stats"),
      fetchJson<OpenTask[]>("/api/tasks?open=true"),
    ]);
    if (statsRes.error) {
      setError(statsRes.error);
      setStats(null);
    } else {
      setStats(statsRes.data);
    }
    setTasksError(tasksRes.error);
    setOpenTasks(Array.isArray(tasksRes.data) ? tasksRes.data.slice(0, 6) : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statCards = stats
    ? [
        { label: "Active Clients", value: stats.workingOnCount, href: "/clients?group=workingon" },
        {
          label: "Awaiting Payment",
          value: stats.paymentOutstandingCount,
          href: "/clients?payment=outstanding",
        },
        {
          label: "MVP Pending Approval",
          value: stats.mvpPendingApprovalCount,
          href: "/clients?mvp=pending",
        },
        { label: "Open Tasks", value: stats.openTaskCount, href: "/tasks" },
      ]
    : [];

  const maxStageCount = stats
    ? Math.max(1, ...stats.stageBreakdown.map((s) => s.count))
    : 1;

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Client operating snapshot
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4" aria-hidden="true">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
                />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
              <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
            <p className="text-sm text-rose-300">{error}</p>
            <Button variant="secondary" className="mt-3" onClick={load}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* On mobile this is a swipeable strip (drag left/right), not a
                stacked list — it becomes a normal grid from `sm` up. */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0 lg:grid-cols-4">
              {statCards.map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  className="shrink-0 w-[72%] snap-start sm:w-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/20 block hover:border-amber-500/40 transition"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-4 text-3xl font-black text-white">{card.value}</p>
                </Link>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h2 className="text-lg font-semibold text-white">Pipeline by stage</h2>
                <div className="mt-5 space-y-3">
                  {stats?.stageBreakdown.map((row) => (
                    <Link
                      key={row.stage}
                      href={`/clients?stage=${row.stage}`}
                      className="flex items-center gap-3 rounded-lg -mx-2 px-2 py-1 hover:bg-slate-800/50 transition"
                    >
                      <span className="w-40 shrink-0 text-xs text-slate-400">
                        {CLIENT_STAGE_LABELS[row.stage]}
                      </span>
                      <div className="h-2.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
                          style={{ width: `${(row.count / maxStageCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-300">
                        {row.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Open follow-ups</h2>
                  <Link href="/tasks" className="text-xs font-medium text-amber-400 hover:text-amber-300">
                    View all →
                  </Link>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  {tasksError ? (
                    <li className="text-xs text-rose-400">Couldn&apos;t load follow-ups — {tasksError}</li>
                  ) : (
                    openTasks.length === 0 && (
                      <li className="text-xs text-slate-500">Nothing outstanding. 🎉</li>
                    )
                  )}
                  {openTasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-200">{task.title}</p>
                          <Link
                            href={`/clients/${task.client.id}`}
                            className="text-xs text-slate-400 hover:text-amber-400"
                          >
                            {task.client.name}
                          </Link>
                        </div>
                        <Badge
                          label={TASK_STATUS_LABELS[task.status]}
                          tone={TASK_STATUS_TONE[task.status]}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-white">Overall progress</h2>
              <div className="mt-5 grid gap-6 sm:grid-cols-3">
                <Link href="/tasks" className="block hover:opacity-80 transition">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tasks completed</p>
                    <p className="text-xs font-semibold text-slate-300">
                      {stats?.tasksDoneCount ?? 0}/{stats?.tasksTotalCount ?? 0}
                    </p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${
                          stats && stats.tasksTotalCount > 0
                            ? Math.round((stats.tasksDoneCount / stats.tasksTotalCount) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </Link>

                <Link href="/clients?group=workedwith" className="block hover:opacity-80 transition">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Companies worked with</p>
                  <p className="mt-2 text-2xl font-black text-white">{stats?.workedWithCount ?? 0}</p>
                </Link>

                <Link href="/clients" className="block hover:opacity-80 transition">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total clients</p>
                  <p className="mt-2 text-2xl font-black text-white">{stats?.totalClients ?? 0}</p>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
