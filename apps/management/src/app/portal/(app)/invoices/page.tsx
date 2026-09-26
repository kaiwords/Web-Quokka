"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton from "@/components/portal/ui/PortalButton";
import { fetchJson } from "@/lib/clientApi";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONE, formatAUD, formatDate, type Invoice } from "@/types";

function isOverdue(inv: Invoice): boolean {
  if (inv.status === "Overdue") return true;
  return inv.status === "Unpaid" && !!inv.dueDate && new Date(inv.dueDate).getTime() < Date.now();
}

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // setState only inside the promise callback — never synchronously in the
  // effect that calls this on mount (react-hooks/set-state-in-effect).
  const load = useCallback(() => {
    return fetchJson<Invoice[]>("/api/portal/invoices").then((res) => {
      setInvoices(res.data ?? []);
      setError(res.error);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setLoading(true);
    void load();
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Invoices</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-sand-900">Invoices</h1>
        </div>

        {loading ? (
          <p className="text-sm text-sand-600">Loading...</p>
        ) : error ? (
          <div className="rounded-2xl border border-coral-500/30 bg-white p-5">
            <p className="text-sm text-coral-600">{error}</p>
            <PortalButton variant="secondary" className="mt-3" onClick={retry}>
              Try again
            </PortalButton>
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-sand-500">No invoices yet.</p>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-white divide-y divide-sand-100">
            {invoices.map((inv) => {
              const overdue = isOverdue(inv);
              return (
                // The whole row navigates to the invoice; the PDF link sits
                // beside the row link (never inside it — nested anchors are
                // invalid HTML).
                <div key={inv.id} className="flex items-center hover:bg-sand-50 transition">
                  <Link href={`/portal/invoices/${inv.id}`} className="flex flex-1 min-w-0 items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-sand-800 truncate">
                        INV-{String(inv.id).padStart(4, "0")} · {inv.description}
                      </p>
                      <p className="text-xs text-sand-500">
                        Issued {formatDate(inv.issueDate)}
                        {inv.dueDate && (
                          <>
                            {" · "}
                            <span className={overdue ? "font-medium text-coral-600" : ""}>
                              Due {formatDate(inv.dueDate)}
                              {overdue && " — Overdue"}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-semibold text-sand-900">{formatAUD(inv.totalAmount)}</p>
                      <PortalBadge label={INVOICE_STATUS_LABELS[inv.status]} tone={INVOICE_STATUS_TONE[inv.status]} />
                    </div>
                  </Link>
                  <a href={`/api/portal/invoices/${inv.id}/pdf`} className="shrink-0 p-4 text-xs text-teal-700 hover:underline">
                    PDF
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
