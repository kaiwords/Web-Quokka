"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { useCurrentUser } from "@/components/layout/Shell";
import { fetchJson, mutate } from "@/lib/clientApi";
import { toast } from "@/components/ui/Toaster";
import {
  CHANGE_REQUEST_STATUS_LABELS,
  CHANGE_REQUEST_STATUS_TONE,
  CHANGE_REQUEST_STATUSES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONE,
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
  client: { id: number; name: string; company: string } | null;
  messages: Msg[];
}

// Renders freeform reference text, turning http(s) tokens into links and
// leaving everything else as plain text.
function ReferenceLinks({ text }: { text: string }) {
  return (
    <>
      {text.split(/([\s,]+)/).map((part, i) =>
        /^https?:\/\//i.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300 break-all">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function StaffChangeRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, loaded: userLoaded } = useCurrentUser();
  const isAdmin = Boolean(user?.isAdmin);

  const [cr, setCr] = useState<Detail | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [loadError, setLoadError] = useState("");

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [quoteSaving, setQuoteSaving] = useState(false);

  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteEstimatedTime, setQuoteEstimatedTime] = useState("");
  // While the user is editing the quote fields, reloads must not overwrite
  // their unsaved input. Cleared on a successful save.
  const quoteDirty = useRef(false);

  const load = useCallback(async () => {
    const { data, error, status } = await fetchJson<Detail>(`/api/change-requests/${params.id}`);
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
      setCr(data);
      if (!quoteDirty.current) {
        setQuoteAmount(data.quoteAmount);
        setQuoteEstimatedTime(data.quoteEstimatedTime);
      }
      setLoadState("ready");
    }
    // Supplemental — a failed invoice lookup just hides the card.
    const inv = await fetchJson<Invoice[]>(`/api/invoices?sourceType=ChangeRequest&sourceId=${params.id}`);
    setInvoice(Array.isArray(inv.data) && inv.data.length > 0 ? inv.data[0] : null);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatusTo(s: ChangeRequestStatus) {
    if (!cr || statusSaving || cr.status === s) return;
    setStatusSaving(true);
    try {
      const { ok } = await mutate(
        `/api/change-requests/${params.id}`,
        { method: "PATCH", body: JSON.stringify({ status: s }) },
        { success: `Status set to "${CHANGE_REQUEST_STATUS_LABELS[s]}"` }
      );
      if (ok) await load();
    } finally {
      setStatusSaving(false);
    }
  }

  async function setIncludedInPlan(included: boolean) {
    if (planSaving) return;
    setPlanSaving(true);
    try {
      const { ok } = await mutate(`/api/change-requests/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ includedInPlan: included }),
      });
      if (ok) await load();
    } finally {
      setPlanSaving(false);
    }
  }

  const quoteAmountValid = quoteAmount.trim() !== "" && !Number.isNaN(Number(quoteAmount)) && Number(quoteAmount) > 0;
  const hasQuote = Boolean(cr?.quoteAmount);

  async function sendQuote() {
    if (quoteSaving) return;
    if (!quoteAmountValid) {
      toast.error("Quote amount must be a number greater than 0, e.g. 500.00");
      return;
    }
    setQuoteSaving(true);
    try {
      const { ok } = await mutate(
        `/api/change-requests/${params.id}`,
        { method: "PATCH", body: JSON.stringify({ quoteAmount, quoteEstimatedTime, status: "QuoteSent" }) },
        { success: hasQuote ? "Quote updated" : "Quote sent" }
      );
      if (ok) {
        quoteDirty.current = false;
        await load();
      }
    } finally {
      setQuoteSaving(false);
    }
  }

  async function sendReply(e?: React.FormEvent) {
    e?.preventDefault();
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { ok } = await mutate(`/api/change-requests/${params.id}/messages`, {
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
    <Link href="/change-requests" className="inline-block text-xs text-slate-400 hover:text-amber-300 transition">
      ← Back to change requests
    </Link>
  );

  if (loadState === "loading") return <><p className="text-sm text-slate-400">Loading...</p></>;
  if (loadState === "notfound")
    return (
      <>
        <div className="space-y-4">
          {backLink}
          <p className="text-sm text-slate-400">Change request not found.</p>
        </div>
      </>
    );
  if (loadState === "error" || !cr)
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
              {cr.client ? (
                <>
                  Client Portal ·{" "}
                  <Link href={`/clients/${cr.client.id}`} className="hover:text-amber-300">
                    {cr.client.company || cr.client.name}
                  </Link>
                </>
              ) : (
                "Client portal"
              )}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{cr.title}</h1>
          </div>
          <Badge label={CHANGE_REQUEST_STATUS_LABELS[cr.status as ChangeRequestStatus] ?? cr.status} tone={CHANGE_REQUEST_STATUS_TONE[cr.status as ChangeRequestStatus] ?? "slate"} />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{cr.description}</p>
          {cr.pageSection && <p className="text-xs text-slate-500">Page/section: {cr.pageSection}</p>}
          {cr.referenceLinks && (
            <p className="text-xs text-slate-500">
              References: <ReferenceLinks text={cr.referenceLinks} />
            </p>
          )}
          {cr.desiredDeadline && <p className="text-xs text-slate-500">Desired by: {formatDate(cr.desiredDeadline)}</p>}
        </div>

        {userLoaded && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            {isAdmin ? (
              <>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Change request status">
                  {CHANGE_REQUEST_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusTo(s)}
                      disabled={statusSaving || cr.status === s}
                      aria-pressed={cr.status === s}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed ${
                        cr.status === s
                          ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                          : statusSaving
                            ? "border-slate-800 text-slate-600"
                            : "border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {CHANGE_REQUEST_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>

                <label className={`flex items-center gap-2 text-xs text-slate-400 ${planSaving ? "cursor-wait opacity-70" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={cr.includedInPlan}
                    disabled={planSaving}
                    onChange={(e) => setIncludedInPlan(e.target.checked)}
                    className="h-4 w-4 accent-amber-500 disabled:opacity-50"
                  />
                  Included in maintenance plan (no quote needed)
                </label>

                {!cr.includedInPlan && (
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
                    <label className="text-xs text-slate-500">
                      Quote price (AUD, ex GST)
                      <Input
                        value={quoteAmount}
                        onChange={(e) => {
                          quoteDirty.current = true;
                          setQuoteAmount(e.target.value);
                        }}
                        placeholder="500.00"
                        inputMode="decimal"
                        className="mt-1"
                      />
                    </label>
                    <label className="text-xs text-slate-500">
                      Estimated time
                      <Input
                        value={quoteEstimatedTime}
                        onChange={(e) => {
                          quoteDirty.current = true;
                          setQuoteEstimatedTime(e.target.value);
                        }}
                        placeholder="2-3 business days"
                        className="mt-1"
                      />
                    </label>
                    <Button onClick={sendQuote} loading={quoteSaving} disabled={!quoteAmountValid}>
                      {hasQuote ? "Update quote" : "Send quote"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {cr.includedInPlan ? (
                  <p className="text-xs text-slate-500">Included in maintenance plan (no quote needed).</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Quote: {cr.quoteAmount ? formatAUD(cr.quoteAmount) : "not set"}
                    {cr.quoteEstimatedTime ? ` · ${cr.quoteEstimatedTime}` : ""}
                  </p>
                )}
                <p className="text-xs text-slate-500">Only admins can update this request.</p>
              </>
            )}
          </div>
        )}

        {invoice && (
          <Link href="/invoices" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-amber-500/40 transition">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Invoice</p>
              <p className="mt-0.5 text-sm text-slate-200">
                INV-{String(invoice.id).padStart(4, "0")} · {formatAUD(invoice.totalAmount)}
              </p>
              <p className="text-xs text-slate-500">
                Issued {formatDate(invoice.issueDate)}
                {invoice.dueDate ? ` · due ${formatDate(invoice.dueDate)}` : ""}
              </p>
            </div>
            <Badge label={INVOICE_STATUS_LABELS[invoice.status]} tone={INVOICE_STATUS_TONE[invoice.status]} />
          </Link>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Conversation</h2>
          {cr.messages.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No messages yet — replies you post appear here.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {cr.messages.map((m) => (
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
