"use client";

import { useCallback, useEffect, useRef, useState, use as usePromise } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton from "@/components/portal/ui/PortalButton";
import { canAct, usePortalUser } from "@/components/portal/PortalShell";
import { fetchJson, mutate, mutateForm } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toaster";
import {
  PORTAL_TICKET_CATEGORY_LABELS,
  PORTAL_TICKET_STATUS_LABELS,
  PORTAL_TICKET_STATUS_TONE,
  TICKET_PRIORITY_TONE,
  TICKET_PRIORITY_RESPONSE_TIME,
  formatDateTime,
  formatFileSize,
  type PortalTicketCategory,
  type PortalTicketStatus,
  type TicketPriority,
} from "@/types";

// Mirrors the server's MAX_DOCUMENT_SIZE (src/lib/documents.ts) — checked
// client-side too so a big file fails fast instead of after a full upload.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// A bare "Low" badge reads like a temperature — spell out what it refers to.
// (Candidate for @/types alongside TICKET_PRIORITY_TONE.)
const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  Low: "Low priority",
  Medium: "Medium priority",
  High: "High priority",
  Urgent: "Urgent",
};

interface Msg {
  id: number;
  authorType: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface TicketDoc {
  id: number;
  originalName: string;
  size: number;
}

interface TicketDetail {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string;
  satisfactionRating: number | null;
  resolvedAt: string | null;
  canReopen: boolean;
  documents: TicketDoc[];
  messages: Msg[];
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user, loaded } = usePortalUser();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [action, setAction] = useState<"resolve" | "reopen" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetchJson<TicketDetail>(`/api/portal/tickets/${id}`);
    if (res.data) {
      setTicket(res.data);
      setNotFound(false);
      setError(null);
    } else if (res.status === 404) {
      setNotFound(true);
      setError(null);
    } else {
      setError(res.error ?? "Something went wrong loading this.");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setLoading(true);
    setError(null);
    void load();
  }

  async function sendReply() {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { ok } = await mutate(
        `/api/portal/tickets/${id}/messages`,
        { method: "POST", body: JSON.stringify({ body }) },
        { error: "Your reply didn't send — please try again." }
      );
      // Only clear the box once the message is actually saved — a failed
      // send used to throw away everything the user had typed.
      if (ok) {
        setReply("");
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  function onReplyKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void sendReply();
    }
  }

  async function doAction(next: "resolve" | "reopen") {
    if (action) return;
    const confirmed = await confirmAction(
      next === "resolve"
        ? {
            title: "Mark this ticket as resolved?",
            message: "You can reopen it within 7 days if the problem comes back.",
            confirmLabel: "Mark resolved",
            tone: "default",
          }
        : {
            title: "Reopen this ticket?",
            message: "We'll let the team know the problem has come back.",
            confirmLabel: "Reopen",
            tone: "default",
          }
    );
    if (!confirmed) return;
    setAction(next);
    try {
      const { ok } = await mutate(
        `/api/portal/tickets/${id}`,
        { method: "PATCH", body: JSON.stringify({ action: next }) },
        { success: next === "resolve" ? "Ticket marked as resolved." : "Ticket reopened." }
      );
      if (ok) await load();
    } finally {
      setAction(null);
    }
  }

  async function rate(rating: number) {
    if (ratingSubmitting) return;
    setRatingSubmitting(true);
    try {
      const { ok } = await mutate(
        `/api/portal/tickets/${id}`,
        { method: "PATCH", body: JSON.stringify({ rating }) },
        { success: "Thanks for your feedback!" }
      );
      if (ok) await load();
    } finally {
      setRatingSubmitting(false);
      setHoverRating(0);
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("That file is over the 10 MB limit — please choose a smaller one.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ticketId", id);
      const { ok } = await mutateForm("/api/portal/documents", formData, { success: "File attached." });
      if (ok) await load();
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const mayAct = loaded && canAct(user);

  return (
    <>
      <div className="space-y-6">
        <div>
          <Link href="/portal/tickets" className="text-xs font-medium text-teal-700 hover:underline">
            ← Back to tickets
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-sand-600">Loading...</p>
        ) : notFound ? (
          <div className="rounded-2xl border border-sand-200 bg-white p-5">
            <p className="text-sm text-sand-700">We couldn&apos;t find that ticket — it may have been removed.</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-coral-500/30 bg-coral-500/5 p-5">
            <p className="text-sm text-coral-600">{error}</p>
            <div className="mt-3">
              <PortalButton variant="secondary" onClick={retry}>
                Retry
              </PortalButton>
            </div>
          </div>
        ) : ticket ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Ticket #{ticket.id}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-sand-900">{ticket.title}</h1>
                <p className="mt-1 text-xs text-sand-500">
                  {ticket.assignedTo && ticket.assignedTo !== "Unassigned"
                    ? `Looked after by ${ticket.assignedTo}`
                    : "Not yet assigned"}
                  {" · "}Expected response {TICKET_PRIORITY_RESPONSE_TIME[ticket.priority as TicketPriority] ?? "soon"}
                </p>
                {loaded && user && !canAct(user) && (
                  <p className="mt-1 text-xs text-sand-400">View-only access — an account owner or manager can reply or update this ticket.</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PortalBadge
                  label={PORTAL_TICKET_CATEGORY_LABELS[ticket.category as PortalTicketCategory] ?? ticket.category}
                  tone="teal"
                />
                <PortalBadge
                  label={TICKET_PRIORITY_LABELS[ticket.priority as TicketPriority] ?? ticket.priority}
                  tone={TICKET_PRIORITY_TONE[ticket.priority as TicketPriority] ?? "slate"}
                />
                <PortalBadge
                  label={PORTAL_TICKET_STATUS_LABELS[ticket.status as PortalTicketStatus] ?? ticket.status}
                  tone={PORTAL_TICKET_STATUS_TONE[ticket.status as PortalTicketStatus] ?? "slate"}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <p className="text-sm text-sand-700 whitespace-pre-wrap">{ticket.description}</p>
              {ticket.documents.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ticket.documents.map((d) => (
                    <a key={d.id} href={`/api/portal/documents/${d.id}`} className="text-xs text-teal-700 hover:underline">
                      {d.originalName} ({formatFileSize(d.size)})
                    </a>
                  ))}
                </div>
              )}
            </div>

            {mayAct && (
              <div className="flex flex-wrap items-center gap-2">
                {ticket.status !== "Resolved" && ticket.status !== "Closed" && (
                  <PortalButton loading={action === "resolve"} disabled={action !== null} onClick={() => doAction("resolve")}>
                    Mark Resolved
                  </PortalButton>
                )}
                {ticket.canReopen && (
                  <PortalButton
                    variant="secondary"
                    loading={action === "reopen"}
                    disabled={action !== null}
                    onClick={() => doAction("reopen")}
                  >
                    Reopen
                  </PortalButton>
                )}
                <input ref={fileInput} type="file" onChange={uploadFile} className="hidden" tabIndex={-1} aria-hidden="true" />
                <PortalButton variant="secondary" type="button" loading={uploading} onClick={() => fileInput.current?.click()}>
                  {uploading ? "Uploading..." : "Attach File"}
                </PortalButton>
                <span className="text-[11px] text-sand-400">Max 10 MB</span>
              </div>
            )}

            {["Resolved", "Closed"].includes(ticket.status) &&
              (ticket.satisfactionRating !== null ? (
                <div className="rounded-2xl border border-sand-200 bg-white p-4 flex flex-wrap items-center gap-2">
                  <span aria-hidden="true" className="text-lg leading-none">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={n <= (ticket.satisfactionRating ?? 0) ? "text-amber-400" : "text-sand-200"}>
                        ★
                      </span>
                    ))}
                  </span>
                  <p className="text-xs text-sand-600">
                    Thanks for your feedback — you rated this {ticket.satisfactionRating}/5.
                  </p>
                </div>
              ) : mayAct ? (
                <div className="rounded-2xl border border-sand-200 bg-white p-4 flex flex-wrap items-center gap-3">
                  <p className="text-xs text-sand-600">How did we do?</p>
                  <div
                    role="radiogroup"
                    aria-label="Rate your support experience out of 5"
                    className="flex items-center gap-0.5"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={false}
                        aria-label={`Rate ${n} of 5`}
                        disabled={ratingSubmitting}
                        onMouseEnter={() => setHoverRating(n)}
                        onFocus={() => setHoverRating(n)}
                        onBlur={() => setHoverRating(0)}
                        onClick={() => rate(n)}
                        className={`text-xl leading-none transition hover:scale-110 disabled:opacity-50 ${
                          n <= hoverRating ? "text-amber-400" : "text-sand-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {ratingSubmitting && <span className="text-[11px] text-sand-400">Saving...</span>}
                </div>
              ) : null)}

            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-sand-900">Conversation</h2>
              {ticket.messages.length === 0 ? (
                <p className="mt-4 text-xs text-sand-500">No messages yet — our team will reply here.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {ticket.messages.map((m) => (
                    <li
                      key={m.id}
                      className={`rounded-xl p-3 text-sm ${m.authorType === "System" ? "text-sand-400 text-xs italic" : m.authorType === "Portal" ? "bg-teal-50 text-sand-800" : "bg-sand-50 text-sand-800"}`}
                    >
                      {m.authorType !== "System" && <p className="text-xs font-semibold text-sand-600 mb-1">{m.authorName}</p>}
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className="mt-1 text-[10px] text-sand-400">{formatDateTime(m.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}

              {mayAct && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendReply();
                  }}
                  className="mt-4 space-y-2"
                >
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={onReplyKeyDown}
                    placeholder="Write a reply..."
                    aria-label="Write a reply"
                    rows={2}
                    className="w-full resize-y rounded-lg border border-sand-200 px-3 py-2 text-sm text-sand-900 focus:border-teal-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-sand-400">Tip: press Ctrl+Enter (⌘+Enter on Mac) to send.</p>
                    <PortalButton type="submit" loading={sending} disabled={!reply.trim()}>
                      Send
                    </PortalButton>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
