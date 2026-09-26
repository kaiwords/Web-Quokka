"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton, { portalButtonClasses } from "@/components/portal/ui/PortalButton";
import { usePortalUser, canAct } from "@/components/portal/PortalShell";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONE, formatAUD, formatDate, type Invoice } from "@/types";

export default function PortalInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user, loaded } = usePortalUser();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(0);
  const [paying, setPaying] = useState(false);

  // setState only inside the promise callback — never synchronously in the
  // effect that calls this on mount (react-hooks/set-state-in-effect).
  // Calling it after paying refreshes in place without a loading flash.
  const load = useCallback(() => {
    return fetchJson<Invoice>(`/api/portal/invoices/${id}`).then((res) => {
      setInvoice(res.data);
      setError(res.error);
      setStatus(res.status);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setLoading(true);
    void load();
  }

  async function payNow(inv: Invoice) {
    const label = `INV-${String(inv.id).padStart(4, "0")}`;
    const confirmed = await confirmAction({
      title: "Pay this invoice?",
      message: `This marks ${label} (${formatAUD(inv.totalAmount)}) as paid.`,
      confirmLabel: "Pay now",
      tone: "default",
    });
    if (!confirmed) return;

    setPaying(true);
    try {
      const { ok } = await mutate(
        `/api/portal/invoices/${id}/pay`,
        { method: "POST" },
        { success: "Payment received — thank you!", error: "Payment failed — please try again." }
      );
      if (ok) await load();
    } finally {
      setPaying(false);
    }
  }

  const payable = invoice?.status === "Unpaid" || invoice?.status === "Overdue";
  const source =
    invoice && invoice.sourceId && invoice.sourceType !== "Manual"
      ? invoice.sourceType === "ChangeRequest"
        ? { label: "For change request", href: `/portal/change-requests/${invoice.sourceId}` }
        : { label: "For suggestion", href: `/portal/suggestions/${invoice.sourceId}` }
      : null;

  return (
    <>
      <div className="max-w-xl space-y-6">
        <Link href="/portal/invoices" className="inline-block text-xs text-teal-700 hover:underline">
          ← Back to invoices
        </Link>

        {loading ? (
          <p className="text-sm text-sand-600">Loading...</p>
        ) : !invoice ? (
          status === 404 ? (
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <p className="text-sm text-sand-700">We couldn&apos;t find that invoice — it may have been removed.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-coral-500/30 bg-white p-5">
              <p className="text-sm text-coral-600">{error ?? "Something went wrong loading this invoice."}</p>
              <PortalButton variant="secondary" className="mt-3" onClick={retry}>
                Try again
              </PortalButton>
            </div>
          )
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Invoice</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-sand-900">INV-{String(invoice.id).padStart(4, "0")}</h1>
              </div>
              <PortalBadge label={INVOICE_STATUS_LABELS[invoice.status]} tone={INVOICE_STATUS_TONE[invoice.status]} />
            </div>

            <a href={`/api/portal/invoices/${invoice.id}/pdf`} className={portalButtonClasses("secondary")}>
              Download PDF
            </a>

            <div className="rounded-2xl border border-sand-200 bg-white p-5 space-y-4">
              <div>
                <p className="text-sm text-sand-800">{invoice.description}</p>
                {source && (
                  <p className="mt-1 text-xs text-sand-500">
                    {source.label}:{" "}
                    <Link href={source.href} className="text-teal-700 hover:underline">
                      {invoice.description}
                    </Link>
                  </p>
                )}
              </div>
              <div className="border-t border-sand-100 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-sand-600">
                  <span>Subtotal (ex. GST)</span>
                  <span>{formatAUD(invoice.amountExGst)}</span>
                </div>
                <div className="flex justify-between text-sand-600">
                  <span>GST (10%)</span>
                  <span>{formatAUD(invoice.gstAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-sand-900 pt-1 border-t border-sand-100">
                  <span>Total (AUD)</span>
                  <span>{formatAUD(invoice.totalAmount)}</span>
                </div>
              </div>
              <p className="text-xs text-sand-500">
                Issued {formatDate(invoice.issueDate)}
                {invoice.dueDate && ` · Due ${formatDate(invoice.dueDate)}`}
              </p>
            </div>

            {invoice.status === "Paid" ? (
              <p className="text-sm text-teal-700">Paid{invoice.paidAt && ` on ${formatDate(invoice.paidAt)}`}.</p>
            ) : payable && loaded ? (
              canAct(user) ? (
                <div className="space-y-2">
                  <PortalButton loading={paying} onClick={() => void payNow(invoice)}>
                    Pay Now
                  </PortalButton>
                  <p className="text-[11px] text-sand-400">Test/demo payment — no card details are collected and no real charge is made yet.</p>
                </div>
              ) : (
                <p className="text-xs text-sand-500">You have view-only access — an Owner or Manager can pay this invoice.</p>
              )
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
