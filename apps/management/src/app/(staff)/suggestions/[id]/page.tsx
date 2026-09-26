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
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUS_TONE,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONE,
  TICKET_PRIORITY_TONE,
  formatAUD,
  formatDate,
  formatDateTime,
  type SuggestionStatus,
  type Invoice,
} from "@/types";

// What happens next at each stage — the business decides and pays; staff
// only prices it beforehand and marks it done afterwards.
const STATUS_HINT: Record<SuggestionStatus, string> = {
  Proposed: "Waiting on the business to approve, snooze, or decline. You can still adjust the price.",
  Snoozed: "The business chose \"maybe later\". You can still adjust the price.",
  Approved: "Approved — waiting on the business to pay the invoice before work starts.",
  Declined: "The business declined this suggestion.",
  InProgress: "Paid (or included in plan) — work is under way. Mark it completed when done.",
  Completed: "Work completed.",
};

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
  client: { id: number; name: string; company: string } | null;
  messages: Msg[];
}

export default function StaffSuggestionDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, loaded: userLoaded } = useCurrentUser();
  const isAdmin = Boolean(user?.isAdmin);

  const [s, setS] = useState<Detail | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [loadError, setLoadError] = useState("");

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [priceSaving, setPriceSaving] = useState(false);

  const [cost, setCost] = useState("");
  const [time, setTime] = useState("");
  // While the user is editing the price fields, reloads must not overwrite
  // their unsaved input. Cleared on a successful save.
  const priceDirty = useRef(false);

  const load = useCallback(async () => {
    const { data, error, status } = await fetchJson<Detail>(`/api/suggestions/${params.id}`);
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
      setS(data);
      if (!priceDirty.current) {
        setCost(data.estimatedCost);
        setTime(data.estimatedTime);
      }
      setLoadState("ready");
    }
    // Supplemental — a failed invoice lookup just hides the card.
    const inv = await fetchJson<Invoice[]>(`/api/invoices?sourceType=Suggestion&sourceId=${params.id}`);
    setInvoice(Array.isArray(inv.data) && inv.data.length > 0 ? inv.data[0] : null);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function markCompleted() {
    if (completing) return;
    setCompleting(true);
    try {
      const { ok } = await mutate(
        `/api/suggestions/${params.id}`,
        { method: "PATCH", body: JSON.stringify({ status: "Completed" }) },
        { success: "Marked completed" }
      );
      if (ok) await load();
    } finally {
      setCompleting(false);
    }
  }

  async function setIncludedInPlan(included: boolean) {
    if (planSaving) return;
    setPlanSaving(true);
    try {
      const { ok } = await mutate(`/api/suggestions/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ includedInPlan: included }),
      });
      if (ok) await load();
    } finally {
      setPlanSaving(false);
    }
  }

  const costValid = cost.trim() !== "" && !Number.isNaN(Number(cost)) && Number(cost) > 0;

  async function savePrice() {
    if (priceSaving) return;
    if (!costValid) {
      toast.error("Price must be a number greater than 0, e.g. 450.00");
      return;
    }
    setPriceSaving(true);
    try {
      const { ok } = await mutate(
        `/api/suggestions/${params.id}`,
        { method: "PATCH", body: JSON.stringify({ estimatedCost: cost, estimatedTime: time }) },
        { success: "Price saved" }
      );
      if (ok) {
        priceDirty.current = false;
        await load();
      }
    } finally {
      setPriceSaving(false);
    }
  }

  async function sendReply(e?: React.FormEvent) {
    e?.preventDefault();
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { ok } = await mutate(`/api/suggestions/${params.id}/messages`, {
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
    <Link href="/suggestions" className="inline-block text-xs text-slate-400 hover:text-amber-300 transition">
      ← Back to suggestions
    </Link>
  );

  if (loadState === "loading") return <><p className="text-sm text-slate-400">Loading...</p></>;
  if (loadState === "notfound")
    return (
      <>
        <div className="space-y-4">
          {backLink}
          <p className="text-sm text-slate-400">Suggestion not found.</p>
        </div>
      </>
    );
  if (loadState === "error" || !s)
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

  const canEditPrice = ["Proposed", "Snoozed"].includes(s.status);

  return (
    <>
      <div className="space-y-6">
        {backLink}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
              {s.client ? (
                <>
                  Client Portal ·{" "}
                  <Link href={`/clients/${s.client.id}`} className="hover:text-amber-300">
                    {s.client.company || s.client.name}
                  </Link>
                </>
              ) : (
                "Client portal"
              )}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{s.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge label={s.priority} tone={TICKET_PRIORITY_TONE[s.priority as keyof typeof TICKET_PRIORITY_TONE] ?? "slate"} />
            <Badge label={SUGGESTION_STATUS_LABELS[s.status as SuggestionStatus] ?? s.status} tone={SUGGESTION_STATUS_TONE[s.status as SuggestionStatus] ?? "slate"} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{s.description}</p>
          {s.expectedBenefit && <p className="text-xs text-slate-500">Expected benefit: {s.expectedBenefit}</p>}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <p className="text-xs text-slate-400">{STATUS_HINT[s.status as SuggestionStatus]}</p>

          {userLoaded &&
            (isAdmin ? (
              <>
                {s.status === "InProgress" && (
                  <Button onClick={markCompleted} loading={completing}>
                    Mark completed
                  </Button>
                )}

                <label
                  className={`flex items-center gap-2 text-xs text-slate-400 ${
                    !canEditPrice ? "opacity-50 cursor-not-allowed" : planSaving ? "cursor-wait opacity-70" : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={s.includedInPlan}
                    disabled={!canEditPrice || planSaving}
                    onChange={(e) => setIncludedInPlan(e.target.checked)}
                    className="h-4 w-4 accent-amber-500 disabled:opacity-50"
                  />
                  Included in maintenance plan (no cost)
                </label>

                {!s.includedInPlan && (
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
                    <label className="text-xs text-slate-500">
                      Estimated cost (AUD, ex GST)
                      <Input
                        value={cost}
                        onChange={(e) => {
                          priceDirty.current = true;
                          setCost(e.target.value);
                        }}
                        placeholder="450.00"
                        inputMode="decimal"
                        disabled={!canEditPrice}
                        className="mt-1"
                      />
                    </label>
                    <label className="text-xs text-slate-500">
                      Estimated time
                      <Input
                        value={time}
                        onChange={(e) => {
                          priceDirty.current = true;
                          setTime(e.target.value);
                        }}
                        placeholder="1-2 business days"
                        disabled={!canEditPrice}
                        className="mt-1"
                      />
                    </label>
                    {canEditPrice && (
                      <Button onClick={savePrice} loading={priceSaving} disabled={!costValid}>
                        Save price
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {s.includedInPlan ? (
                  <p className="text-xs text-slate-500">Included in maintenance plan (no cost).</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Estimated cost: {s.estimatedCost ? formatAUD(s.estimatedCost) : "not set"}
                    {s.estimatedTime ? ` · ${s.estimatedTime}` : ""}
                  </p>
                )}
                <p className="text-xs text-slate-500">Only admins can update this suggestion.</p>
              </>
            ))}

          <p className="text-xs text-slate-500">Category: {s.category}</p>
        </div>

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
          {s.messages.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">No messages yet — replies you post appear here.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {s.messages.map((m) => (
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
