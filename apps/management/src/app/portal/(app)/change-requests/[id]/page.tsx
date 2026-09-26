"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton from "@/components/portal/ui/PortalButton";
import { canAct, usePortalUser } from "@/components/portal/PortalShell";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import {
  CHANGE_REQUEST_STATUS_LABELS,
  CHANGE_REQUEST_STATUS_TONE,
  formatAUD,
  formatDate,
  formatDateTime,
  type ChangeRequestStatus,
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
  description: string;
  pageSection: string;
  referenceLinks: string;
  desiredDeadline: string | null;
  status: string;
  includedInPlan: boolean;
  quoteAmount: string;
  quoteEstimatedTime: string;
  messages: Msg[];
}

// The reference field is free text — turn any http(s) tokens into real
// links and leave the rest as plain words.
function renderReferenceLinks(raw: string) {
  return raw
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((part, i) => (
      <span key={`${part}-${i}`}>
        {i > 0 ? " " : ""}
        {/^https?:\/\//i.test(part) ? (
          <a href={part} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline break-all">
            {part}
          </a>
        ) : (
          part
        )}
      </span>
    ));
}

export default function ChangeRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user, loaded } = usePortalUser();
  const [cr, setCr] = useState<Detail | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState<"Approved" | "Declined" | null>(null);

  const load = useCallback(async () => {
    const res = await fetchJson<Detail>(`/api/portal/change-requests/${id}`);
    if (res.data) {
      setCr(res.data);
      setNotFound(false);
      setError(null);
    } else if (res.status === 404) {
      setNotFound(true);
      setError(null);
    } else {
      setError(res.error ?? "Something went wrong loading this.");
    }
    setLoading(false);

    // The invoice banner is a nicety — if this call fails we just don't
    // show it rather than failing the whole page.
    const inv = await fetchJson<Invoice[]>(`/api/portal/invoices?sourceType=ChangeRequest&sourceId=${id}`);
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

  async function respond(decision: "Approved" | "Declined") {
    if (!cr || acting) return;
    if (decision === "Approved") {
      const confirmed = await confirmAction({
        title: "Approve this quote?",
        message: cr.includedInPlan
          ? "This work is included in your maintenance plan — it will start right away."
          : `Approving creates an invoice for ${formatAUD(cr.quoteAmount)}.`,
        confirmLabel: "Approve",
        tone: "default",
      });
      if (!confirmed) return;
    } else {
      const confirmed = await confirmAction({
        title: "Decline this change request?",
        confirmLabel: "Decline",
        tone: "danger",
      });
      if (!confirmed) return;
    }
    setActing(decision);
    try {
      const { ok } = await mutate(
        `/api/portal/change-requests/${id}`,
        { method: "PATCH", body: JSON.stringify({ decision }) },
        {
          success:
            decision === "Declined"
              ? "Change request declined."
              : cr.includedInPlan
                ? "Approved — work is underway."
                : "Approved — we've issued the invoice.",
        }
      );
      if (ok) await load();
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
        `/api/portal/change-requests/${id}/messages`,
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
  // The server would happily invoice $0 for a quote with no amount — hold
  // the Approve button until a real price is on the quote.
  const quoteTbc = cr ? !cr.includedInPlan && !(parseFloat(cr.quoteAmount) > 0) : false;

  return (
    <>
      <div className="space-y-6">
        <div>
          <Link href="/portal/change-requests" className="text-xs font-medium text-teal-700 hover:underline">
            ← Back to change requests
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-sand-600">Loading...</p>
        ) : notFound ? (
          <div className="rounded-2xl border border-sand-200 bg-white p-5">
            <p className="text-sm text-sand-700">We couldn&apos;t find that change request — it may have been removed.</p>
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
        ) : cr ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Change Request #{cr.id}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-sand-900">{cr.title}</h1>
                {loaded && user && !canAct(user) && (
                  <p className="mt-1 text-xs text-sand-400">View-only access — an account owner or manager can respond to quotes and reply.</p>
                )}
              </div>
              <PortalBadge
                label={CHANGE_REQUEST_STATUS_LABELS[cr.status as ChangeRequestStatus] ?? cr.status}
                tone={CHANGE_REQUEST_STATUS_TONE[cr.status as ChangeRequestStatus] ?? "slate"}
              />
            </div>

            <div className="rounded-2xl border border-sand-200 bg-white p-5 space-y-2">
              <p className="text-sm text-sand-700 whitespace-pre-wrap">{cr.description}</p>
              {cr.pageSection && <p className="text-xs text-sand-500">Page/section: {cr.pageSection}</p>}
              {cr.referenceLinks && <p className="text-xs text-sand-500">References: {renderReferenceLinks(cr.referenceLinks)}</p>}
              {cr.desiredDeadline && <p className="text-xs text-sand-500">Desired by: {formatDate(cr.desiredDeadline)}</p>}
            </div>

            {cr.includedInPlan && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-700">Included in your maintenance plan — no additional cost.</p>
              </div>
            )}

            {cr.status === "QuoteSent" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
                <p className="text-sm font-semibold text-sand-900">Quote from WebQuokka</p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-sand-500">Price (+ GST)</p>
                    <p className="text-lg font-bold text-sand-900">
                      {cr.quoteAmount && parseFloat(cr.quoteAmount) > 0 ? formatAUD(cr.quoteAmount) : "TBC"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-sand-500">Estimated time</p>
                    <p className="text-lg font-bold text-sand-900">{cr.quoteEstimatedTime || "TBC"}</p>
                  </div>
                </div>
                {mayAct && (
                  <>
                    <div className="flex gap-2">
                      <PortalButton loading={acting === "Approved"} disabled={acting !== null || quoteTbc} onClick={() => respond("Approved")}>
                        Approve
                      </PortalButton>
                      <PortalButton variant="danger" loading={acting === "Declined"} disabled={acting !== null} onClick={() => respond("Declined")}>
                        Decline
                      </PortalButton>
                    </div>
                    {quoteTbc && <p className="text-xs text-sand-500">We&apos;ll confirm the price before you can approve.</p>}
                  </>
                )}
              </div>
            )}

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

            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-sand-900">Conversation</h2>
              {cr.messages.length === 0 ? (
                <p className="mt-4 text-xs text-sand-500">No messages yet — our team will reply here.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {cr.messages.map((m) => (
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
                    placeholder="Ask a question..."
                    aria-label="Ask a question"
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
