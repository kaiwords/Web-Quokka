"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton from "@/components/portal/ui/PortalButton";
import { canAct, usePortalUser } from "@/components/portal/PortalShell";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import {
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUS_TONE,
  formatAUD,
  formatDate,
  formatDateTime,
  type Invoice,
} from "@/types";

interface Msg {
  id: number;
  authorType: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface Detail {
  id: number;
  title: string;
  category: string;
  description: string;
  expectedBenefit: string;
  priority: string;
  estimatedCost: string;
  estimatedTime: string;
  includedInPlan: boolean;
  status: string;
  snoozeUntil: string | null;
  declineReason: string;
  messages: Msg[];
}

// Local-timezone yyyy-mm-dd (toISOString is UTC, which can land a day early
// for Australian users).
function localIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const INPUT_CLASSES =
  "rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none";

export default function SuggestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user, loaded } = usePortalUser();
  const [s, setS] = useState<Detail | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState<"Approved" | "Snoozed" | "Declined" | null>(null);
  const [openPanel, setOpenPanel] = useState<"snooze" | "decline" | null>(null);
  const [snoozeDate, setSnoozeDate] = useState("");
  const [snoozeNote, setSnoozeNote] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const load = useCallback(async () => {
    const res = await fetchJson<Detail>(`/api/portal/suggestions/${id}`);
    if (res.data) {
      setS(res.data);
      setNotFound(false);
      setError(null);
    } else if (res.status === 404) {
      setNotFound(true);
      setError(null);
    } else {
      setError(res.error ?? "Something went wrong loading this.");
    }
    setLoading(false);

    // The invoice banner is a nicety — a failed load just hides it.
    const inv = await fetchJson<Invoice[]>(`/api/portal/invoices?sourceType=Suggestion&sourceId=${id}`);
    setInvoice(Array.isArray(inv.data) ? (inv.data.find((i) => i.status !== "Void") ?? null) : null);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setLoading(true);
    setError(null);
    void load();
  }

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = localIsoDate(tomorrowDate);

  const hasCost = s ? !s.includedInPlan && parseFloat(s.estimatedCost) > 0 : false;
  // The server would happily invoice $0 for a suggestion with no cost set —
  // hold the Approve button until a real price is confirmed.
  const approveTbc = s ? !s.includedInPlan && !(parseFloat(s.estimatedCost) > 0) : false;

  async function approve() {
    if (!s || acting) return;
    const confirmed = await confirmAction({
      title: "Approve this suggestion?",
      message: s.includedInPlan
        ? "This work is included in your maintenance plan — it will start right away."
        : `Approving creates an invoice for ${formatAUD(s.estimatedCost)}.`,
      confirmLabel: "Approve",
      tone: "default",
    });
    if (!confirmed) return;
    setActing("Approved");
    try {
      const { ok } = await mutate(
        `/api/portal/suggestions/${id}`,
        { method: "PATCH", body: JSON.stringify({ decision: "Approved" }) },
        { success: s.includedInPlan ? "Approved — work is underway." : "Approved — we've issued the invoice." }
      );
      if (ok) {
        setOpenPanel(null);
        await load();
      }
    } finally {
      setActing(null);
    }
  }

  async function confirmSnooze() {
    if (acting) return;
    if (!snoozeDate) {
      setSnoozeNote("Please pick a date to revisit this first.");
      return;
    }
    if (snoozeDate < tomorrow) {
      setSnoozeNote("Please pick a date from tomorrow onwards.");
      return;
    }
    setSnoozeNote(null);
    setActing("Snoozed");
    try {
      const { ok } = await mutate(
        `/api/portal/suggestions/${id}`,
        { method: "PATCH", body: JSON.stringify({ decision: "Snoozed", snoozeUntil: snoozeDate }) },
        { success: `Snoozed until ${formatDate(snoozeDate)} — we'll check back then.` }
      );
      if (ok) {
        setOpenPanel(null);
        setSnoozeDate("");
        await load();
      }
    } finally {
      setActing(null);
    }
  }

  async function confirmDecline() {
    if (acting) return;
    const confirmed = await confirmAction({
      title: "Decline this suggestion?",
      confirmLabel: "Decline",
      tone: "danger",
    });
    if (!confirmed) return;
    setActing("Declined");
    try {
      const { ok } = await mutate(
        `/api/portal/suggestions/${id}`,
        { method: "PATCH", body: JSON.stringify({ decision: "Declined", reason: declineReason.trim() || undefined }) },
        { success: "Suggestion declined." }
      );
      if (ok) {
        setOpenPanel(null);
        setDeclineReason("");
        await load();
      }
    } finally {
      setActing(null);
    }
  }

  async function sendReply() {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { ok } = await mutate(
        `/api/portal/suggestions/${id}/messages`,
        { method: "POST", body: JSON.stringify({ body }) },
        { error: "Your message didn't send — please try again." }
      );
      // Only clear the box once the message actually saved.
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

  const mayAct = loaded && canAct(user);

  return (
    <>
      <div className="space-y-6">
        <div>
          <Link href="/portal/suggestions" className="text-xs font-medium text-teal-700 hover:underline">
            ← Back to suggestions
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-sand-600">Loading...</p>
        ) : notFound ? (
          <div className="rounded-2xl border border-sand-200 bg-white p-5">
            <p className="text-sm text-sand-700">We couldn&apos;t find that suggestion — it may have been removed.</p>
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
        ) : s ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Suggestion · {s.category}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-sand-900">{s.title}</h1>
                {loaded && user && !canAct(user) && (
                  <p className="mt-1 text-xs text-sand-400">View-only access — an account owner or manager can decide on suggestions.</p>
                )}
              </div>
              <PortalBadge
                label={SUGGESTION_STATUS_LABELS[s.status as keyof typeof SUGGESTION_STATUS_LABELS] ?? s.status}
                tone={SUGGESTION_STATUS_TONE[s.status as keyof typeof SUGGESTION_STATUS_TONE] ?? "slate"}
              />
            </div>

            <div className="rounded-2xl border border-sand-200 bg-white p-5 space-y-2">
              <p className="text-sm text-sand-700 whitespace-pre-wrap">{s.description}</p>
              {s.expectedBenefit && (
                <p className="text-xs text-sand-500">
                  <span className="font-medium text-sand-700">Expected benefit:</span> {s.expectedBenefit}
                </p>
              )}
              <p className="text-sm font-semibold text-sand-900">
                {s.includedInPlan
                  ? "Included in your maintenance plan"
                  : hasCost
                    ? `${formatAUD(s.estimatedCost)} · ${s.estimatedTime || "TBC"}`
                    : "Cost TBC"}
              </p>
              {s.status === "Snoozed" && s.snoozeUntil && (
                <p className="text-xs text-sand-500">Snoozed until {formatDate(s.snoozeUntil)} — you can still decide any time.</p>
              )}
              {s.status === "Declined" && s.declineReason && <p className="text-xs text-sand-500">Declined: {s.declineReason}</p>}
            </div>

            {invoice && invoice.status !== "Void" && (
              <Link href={`/portal/invoices/${invoice.id}`} className="block rounded-2xl border border-amber-200 bg-amber-50 p-4 hover:border-amber-300 transition">
                <p className="text-sm font-semibold text-sand-900">
                  {invoice.status === "Paid" ? "Paid" : "Invoice awaiting payment"} — {formatAUD(invoice.totalAmount)}
                </p>
                {(invoice.status === "Unpaid" || invoice.status === "Overdue") && (
                  <p className="text-xs text-sand-600">Tap to pay and start the work.</p>
                )}
              </Link>
            )}

            {mayAct && ["Proposed", "Snoozed"].includes(s.status) && (
              <div className="rounded-2xl border border-sand-200 bg-white p-5 space-y-3">
                <p className="text-sm font-medium text-sand-800">What would you like to do with this suggestion?</p>
                <div className="flex flex-wrap gap-2">
                  <PortalButton loading={acting === "Approved"} disabled={acting !== null || approveTbc} onClick={approve}>
                    Approve
                  </PortalButton>
                  <PortalButton
                    variant="secondary"
                    disabled={acting !== null}
                    aria-expanded={openPanel === "snooze"}
                    onClick={() => {
                      setOpenPanel(openPanel === "snooze" ? null : "snooze");
                      setSnoozeNote(null);
                    }}
                  >
                    Maybe Later
                  </PortalButton>
                  <PortalButton
                    variant="danger"
                    disabled={acting !== null}
                    aria-expanded={openPanel === "decline"}
                    onClick={() => setOpenPanel(openPanel === "decline" ? null : "decline")}
                  >
                    Decline
                  </PortalButton>
                </div>
                {approveTbc && <p className="text-xs text-sand-500">We&apos;ll confirm the price before you can approve.</p>}

                {openPanel === "snooze" && (
                  <div className="rounded-xl border border-sand-200 bg-sand-50 p-3 space-y-2">
                    <label htmlFor="snooze-until" className="block text-xs font-medium text-sand-600">
                      When should we bring this back?
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        id="snooze-until"
                        type="date"
                        min={tomorrow}
                        value={snoozeDate}
                        onChange={(e) => {
                          setSnoozeDate(e.target.value);
                          setSnoozeNote(null);
                        }}
                        className={INPUT_CLASSES}
                      />
                      <PortalButton variant="secondary" loading={acting === "Snoozed"} disabled={acting !== null} onClick={confirmSnooze}>
                        Snooze until then
                      </PortalButton>
                    </div>
                    {snoozeNote && <p className="text-xs text-coral-600">{snoozeNote}</p>}
                  </div>
                )}

                {openPanel === "decline" && (
                  <div className="rounded-xl border border-sand-200 bg-sand-50 p-3 space-y-2">
                    <label htmlFor="decline-reason" className="block text-xs font-medium text-sand-600">
                      Tell us why (optional)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        id="decline-reason"
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="e.g. Not a priority right now"
                        className={`flex-1 min-w-48 ${INPUT_CLASSES}`}
                      />
                      <PortalButton variant="danger" loading={acting === "Declined"} disabled={acting !== null} onClick={confirmDecline}>
                        Decline suggestion
                      </PortalButton>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-sand-900">Questions / discussion</h2>
              {s.messages.length === 0 ? (
                <p className="mt-4 text-xs text-sand-500">No messages yet — ask us anything about this suggestion.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {s.messages.map((m) => (
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
                    placeholder="Ask a question or negotiate..."
                    aria-label="Ask a question or negotiate"
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
