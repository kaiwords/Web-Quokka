"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { useCurrentUser } from "@/components/layout/Shell";
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TONE,
  TICKET_PRIORITY_TONE,
  formatDate,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/types";

interface ClientOption {
  id: number;
  name: string;
}

const STATUS_OPTIONS: TicketStatus[] = ["New", "InProgress", "Done"];
const PRIORITY_OPTIONS: TicketPriority[] = ["Low", "Medium", "High"];

const CHIP_BASE = "rounded-lg px-3 py-1.5 border transition";
const CHIP_ACTIVE = "bg-amber-500/15 text-amber-400 border-amber-500/50";
const CHIP_INACTIVE = "text-slate-400 hover:text-slate-200 border-transparent";

export default function RequestsPage() {
  const { user, loaded: userLoaded } = useCurrentUser();

  const [requests, setRequests] = useState<(Ticket & { client: ClientOption | null })[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium" as TicketPriority,
    clientId: "",
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchJson<(Ticket & { client: ClientOption | null })[]>("/api/requests");
    setRequests(Array.isArray(res.data) ? res.data : []);
    setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchJson<ClientOption[]>("/api/clients?group=workingon").then((res) => {
      setClients(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  async function addRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    const { ok } = await mutate(
      "/api/requests",
      { method: "POST", body: JSON.stringify(form) },
      { success: "Request submitted", error: "Failed to submit request" }
    );
    setCreating(false);
    if (ok) {
      setForm({ title: "", description: "", priority: "Medium", clientId: "" });
      load();
    }
  }

  async function setStatus(id: number, status: TicketStatus) {
    await mutate(`/api/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    // Refetch either way — a controlled <select> needs a re-render to snap
    // back when the server rejected the change.
    load();
  }

  async function deleteRequest(req: Ticket) {
    const confirmed = await confirmAction({
      title: "Remove request?",
      message: `"${req.title}" will be permanently removed.`,
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/requests/${req.id}`,
      { method: "DELETE" },
      { success: "Request removed", error: "Failed to remove request" }
    );
    if (ok) load();
  }

  const filtered = requests.filter((r) => statusFilter === "all" || r.status === statusFilter);

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Requests</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Requests from the team</h1>
          <p className="mt-1 text-sm text-slate-500">
            Anything you need — submit it here and an admin will pick it up.
          </p>
        </div>

        <form
          onSubmit={addRequest}
          className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:grid-cols-4"
        >
          <input
            required
            placeholder="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="sm:col-span-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
          />
          <select
            value={form.priority}
            aria-label="Priority"
            onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p} priority
              </option>
            ))}
          </select>
          <select
            value={form.clientId}
            aria-label="Client"
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
          >
            <option value="">No specific client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="sm:col-span-4 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
          />
          <Button type="submit" loading={creating} className="w-full sm:w-auto">
            Submit request
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
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className={`${CHIP_BASE} ${statusFilter === s ? CHIP_ACTIVE : CHIP_INACTIVE}`}
            >
              {TICKET_STATUS_LABELS[s]}
            </button>
          ))}
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
        ) : filtered.length === 0 ? (
          statusFilter !== "all" ? (
            <p className="text-sm text-slate-500">
              No requests match this filter.{" "}
              <button
                onClick={() => setStatusFilter("all")}
                className="text-amber-400 hover:text-amber-300 underline"
              >
                Clear filter
              </button>
            </p>
          ) : (
            <p className="text-sm text-slate-500">No requests yet.</p>
          )
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => {
              const canManage = user?.isAdmin || user?.username === req.createdBy;
              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 ${
                    req.status === "Done" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{req.title}</p>
                      {req.description && (
                        <p className="mt-1 text-sm text-slate-400">{req.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {req.client && (
                          <Link href={`/clients/${req.client.id}`} className="hover:text-amber-400">
                            {req.client.name}
                          </Link>
                        )}
                        <span>Raised by {req.createdBy}</span>
                        <span>{formatDate(req.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge label={req.priority} tone={TICKET_PRIORITY_TONE[req.priority]} />
                      {userLoaded && user?.isAdmin ? (
                        <select
                          value={req.status}
                          aria-label="Request status"
                          onChange={(e) => setStatus(req.id, e.target.value as TicketStatus)}
                          className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {TICKET_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge
                          label={TICKET_STATUS_LABELS[req.status as TicketStatus]}
                          tone={TICKET_STATUS_TONE[req.status as TicketStatus]}
                        />
                      )}
                      {userLoaded && canManage && (
                        <button
                          onClick={() => deleteRequest(req)}
                          className="text-xs text-slate-500 hover:text-rose-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
