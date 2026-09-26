"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { useCurrentUser } from "@/components/layout/Shell";
import AssigneeSelect from "@/components/ui/AssigneeSelect";
import { fetchJson, mutate } from "@/lib/clientApi";
import {
  PORTAL_TICKET_STATUS_LABELS,
  PORTAL_TICKET_STATUS_TONE,
  PORTAL_TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_TONE,
  PORTAL_TICKET_STATUSES,
  formatFileSize,
  formatDateTime,
  type PortalTicketStatus,
  type PortalTicketCategory,
} from "@/types";

interface Msg {
  id: number;
  authorType: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface TicketDetail {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string;
  assignedToUserId: number | null;
  satisfactionRating: number | null;
  client: { id: number; name: string; company: string } | null;
  documents: { id: number; originalName: string; size: number }[];
  messages: Msg[];
}

export default function StaffClientTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, loaded: userLoaded } = useCurrentUser();
  const isAdmin = Boolean(user?.isAdmin);

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [loadError, setLoadError] = useState("");

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const [assigneeSaving, setAssigneeSaving] = useState(false);
  // While the user is editing the assignee, reloads must not overwrite their
  // unsaved input. Cleared on save or Escape-revert.
  const assigneeDirty = useRef(false);

  const load = useCallback(async () => {
    const { data, error, status } = await fetchJson<TicketDetail>(`/api/client-tickets/${params.id}`);
    if (error) {
      if (status === 404) {
        setLoadState("notfound");
      } else {
        setLoadError(error);
        setLoadState("error");
      }
      return;
    }
    if (data) {
      setTicket(data);
      setLoadState("ready");
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(status: PortalTicketStatus) {
    if (!ticket || statusSaving || ticket.status === status) return;
    setStatusSaving(true);
    try {
      const { ok } = await mutate(
        `/api/client-tickets/${params.id}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
        { success: `Status set to "${PORTAL_TICKET_STATUS_LABELS[status]}"` }
      );
      if (ok) await load();
    } finally {
      setStatusSaving(false);
    }
  }

  async function saveAssignee(assignedToUserId: number | null) {
    if (!ticket || assigneeSaving || assignedToUserId === ticket.assignedToUserId) return;
    setAssigneeSaving(true);
    try {
      const { ok } = await mutate(
        `/api/client-tickets/${params.id}`,
        { method: "PATCH", body: JSON.stringify({ assignedToUserId }) },
        { success: "Assignee updated" }
      );
      if (ok) await load();
    } finally {
      setAssigneeSaving(false);
    }
  }

  async function sendReply(e?: React.FormEvent) {
    e?.preventDefault();
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { ok } = await mutate(`/api/client-tickets/${params.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      if (ok) {
        setReply(""); // only clear once the server has it — a failure keeps the draft
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  const backLink = (
    <Link href="/client-tickets" className="inline-block text-xs text-slate-400 hover:text-amber-300 transition">
      ← Back to portal tickets
    </Link>
  );

  if (loadState === "loading") return <><p className="text-sm text-slate-400">Loading...</p></>;
  if (loadState === "notfound")
    return (
      <>
        <div className="space-y-4">
          {backLink}
          <p className="text-sm text-slate-400">Ticket not found.</p>
        </div>
      </>
    );
  if (loadState === "error" || !ticket)
    return (
      <>
        <div className="space-y-4">
          {backLink}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-sm text-rose-300">{loadError || "Something went wrong loading this."}</p>
            <Button
              variant="secondary"
              onClick={() => {
                setLoadState("loading");
                load();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </>
    );

  return (
    <>
      <div className="space-y-6">
        {backLink}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
              {ticket.client ? (
                <>
                  Client Portal ·{" "}
                  <Link href={`/clients/${ticket.client.id}`} className="hover:text-amber-300">
                    {ticket.client.company || ticket.client.name}
                  </Link>
                </>
              ) : (
                "Client portal"
              )}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{ticket.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge label={PORTAL_TICKET_CATEGORY_LABELS[ticket.category as PortalTicketCategory] ?? ticket.category} tone="slate" />
            <Badge label={ticket.priority} tone={TICKET_PRIORITY_TONE[ticket.priority as keyof typeof TICKET_PRIORITY_TONE] ?? "slate"} />
            <Badge label={PORTAL_TICKET_STATUS_LABELS[ticket.status as PortalTicketStatus] ?? ticket.status} tone={PORTAL_TICKET_STATUS_TONE[ticket.status as PortalTicketStatus] ?? "slate"} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{ticket.description}</p>
          {ticket.documents.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {ticket.documents.map((d) => (
                <a key={d.id} href={`/api/documents/${d.id}`} className="text-xs text-amber-400 hover:text-amber-300">
                  {d.originalName} ({formatFileSize(d.size)})
                </a>
              ))}
            </div>
          )}
        </div>

        {userLoaded && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-wrap items-center gap-3">
            {isAdmin ? (
              <>
                <select
                  value={ticket.status}
                  disabled={statusSaving}
                  onChange={(e) => setStatus(e.target.value as PortalTicketStatus)}
                  aria-label="Ticket status"
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                >
                  {PORTAL_TICKET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PORTAL_TICKET_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <span className="w-44">
                    <AssigneeSelect
                      aria-label="Assigned developer"
                      value={ticket.assignedToUserId}
                      disabled={assigneeSaving}
                      onChange={saveAssignee}
                    />
                  </span>
                  <span className="text-xs text-slate-500">assigned developer · they&apos;re notified</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">Only admins can update this ticket.</p>
            )}
            {ticket.satisfactionRating !== null && <span className="text-xs text-slate-400">Client rated {ticket.satisfactionRating}/5 ★</span>}
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Conversation</h2>
          {ticket.messages.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No messages yet — replies you post appear here.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {ticket.messages.map((m) => (
                <li key={m.id} className={`rounded-lg p-3 text-sm ${m.authorType === "System" ? "text-slate-500 text-xs italic" : m.authorType === "Staff" ? "bg-amber-500/10 text-slate-200" : "bg-slate-950/40 text-slate-200"}`}>
                  {m.authorType !== "System" && <p className="text-xs font-semibold text-slate-400 mb-1">{m.authorName}</p>}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{formatDateTime(m.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
          {userLoaded &&
            (isAdmin ? (
              <form onSubmit={sendReply} className="mt-4 flex items-start gap-2">
                <div className="flex-1">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    rows={2}
                    placeholder="Reply to the client..."
                    aria-label="Reply to the client"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">Ctrl/⌘ + Enter to send</p>
                </div>
                <Button type="submit" loading={sending} disabled={!reply.trim()}>
                  Send
                </Button>
              </form>
            ) : (
              <p className="mt-4 text-xs text-slate-500">Only admins can reply to the client.</p>
            ))}
        </div>
      </div>
    </>
  );
}
