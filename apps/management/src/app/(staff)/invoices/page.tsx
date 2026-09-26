"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { useCurrentUser } from "@/components/layout/Shell";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONE,
  formatAUD,
  formatDate,
  type Invoice,
} from "@/types";

interface Row extends Invoice {
  client: { id: number; name: string; company: string } | null;
}

// An Unpaid invoice whose due day has passed — the stored status may still
// say Unpaid, so this is a display cue, not a status.
function isOverdue(inv: Row): boolean {
  if (inv.status !== "Unpaid" || !inv.dueDate) return false;
  const due = new Date(inv.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return due.getTime() < startOfToday.getTime();
}

export default function StaffInvoicesPage() {
  const { user, loaded: userLoaded } = useCurrentUser();
  const isAdmin = userLoaded && !!user?.isAdmin;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetchJson<Row[]>(`/api/invoices?${params}`);
    setRows(Array.isArray(res.data) ? res.data : []);
    setError(res.error);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function setInvoiceStatus(inv: Row, newStatus: string) {
    if (newStatus === inv.status) return;

    if (newStatus === "Paid") {
      const confirmed = await confirmAction({
        title: "Mark as paid?",
        message: "This moves the linked request to In Progress.",
        confirmLabel: "Mark as paid",
        tone: "default",
      });
      if (!confirmed) {
        setRows((r) => [...r]); // re-render so the controlled select snaps back
        return;
      }
    }
    if (newStatus === "Void") {
      const confirmed = await confirmAction({
        title: "Void this invoice?",
        message: "Clients will no longer be asked to pay it.",
        confirmLabel: "Void invoice",
        tone: "danger",
      });
      if (!confirmed) {
        setRows((r) => [...r]);
        return;
      }
    }

    await mutate(
      `/api/invoices/${inv.id}`,
      { method: "PATCH", body: JSON.stringify({ status: newStatus }) },
      { success: "Invoice updated" }
    );
    // Refetch either way — on failure this also snaps the select back.
    load();
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Client Portal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Invoices</h1>
        </div>

        <select
          value={status}
          aria-label="Filter by status"
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

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
        ) : rows.length === 0 ? (
          status ? (
            <p className="text-sm text-slate-500">
              No invoices match this filter.{" "}
              <button
                onClick={() => setStatus("")}
                className="text-amber-400 hover:text-amber-300 underline"
              >
                Clear filter
              </button>
            </p>
          ) : (
            <p className="text-sm text-slate-500">No invoices yet.</p>
          )
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800">
            {rows.map((inv) => {
              const overdue = isOverdue(inv);
              return (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm text-slate-200">
                      <strong className="font-semibold">INV-{String(inv.id).padStart(4, "0")}</strong>
                      {inv.client && (
                        <>
                          {" · "}
                          <Link
                            href={`/clients/${inv.client.id}`}
                            className="hover:text-amber-400 transition"
                          >
                            {inv.client.company || inv.client.name}
                          </Link>
                        </>
                      )}
                      {" · "}
                      {inv.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      Issued {formatDate(inv.issueDate)}
                      {inv.dueDate && (
                        <>
                          {" · "}
                          <span className={overdue ? "text-rose-400 font-semibold" : undefined}>
                            Due {formatDate(inv.dueDate)}
                            {overdue && " (overdue)"}
                          </span>
                        </>
                      )}
                      {" · "}
                      {formatAUD(inv.totalAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <select
                        value={inv.status}
                        aria-label="Invoice status"
                        onChange={(e) => setInvoiceStatus(inv, e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
                      >
                        {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    )}
                    <Badge label={INVOICE_STATUS_LABELS[inv.status]} tone={INVOICE_STATUS_TONE[inv.status]} />
                    <a href={`/api/invoices/${inv.id}/pdf`} className="text-xs text-amber-400 hover:text-amber-300">
                      PDF
                    </a>
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
