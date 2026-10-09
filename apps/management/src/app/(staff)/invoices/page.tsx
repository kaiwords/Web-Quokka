"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fetchJson, mutate, mutateForm } from "@/lib/clientApi";
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

interface ClientOption {
  id: number;
  name: string;
  company: string;
}

// Mirrors lib/invoices.ts computeGst — a preview only; the server recomputes.
const GST_RATE = 0.1;

const inputClass =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none";
const labelClass = "block text-xs font-medium text-slate-400";

const EMPTY_FORM = { clientId: "", description: "", amountExGst: "", dueDate: "" };

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

  // "New invoice" (admin): create from fields, optionally with an uploaded
  // PDF that replaces the generated document everywhere it's downloaded.
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);

  // Attach/replace a PDF on an existing invoice: one hidden input, retargeted
  // by whichever row's button was clicked.
  const rowFileRef = useRef<HTMLInputElement>(null);
  const rowInvoiceIdRef = useRef<number | null>(null);
  const [uploadingRowId, setUploadingRowId] = useState<number | null>(null);

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

  // The client dropdown only matters once an admin opens the form.
  useEffect(() => {
    if (!showForm || clients.length > 0) return;
    fetchJson<ClientOption[]>("/api/clients").then((res) => {
      if (!Array.isArray(res.data)) return;
      const label = (c: ClientOption) => c.company || c.name;
      setClients([...res.data].sort((a, b) => label(a).localeCompare(label(b))));
    });
  }, [showForm, clients.length]);

  const amountNumber = parseFloat(form.amountExGst);
  const amountValid = Number.isFinite(amountNumber) && amountNumber > 0;
  const gstPreview = amountValid ? amountNumber * GST_RATE : 0;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.description.trim() || !amountValid) return;

    setCreating(true);
    try {
      const created = await mutate<Invoice>(
        `/api/clients/${form.clientId}/invoices`,
        {
          method: "POST",
          body: JSON.stringify({
            description: form.description,
            amountExGst: form.amountExGst,
            ...(form.dueDate ? { dueDate: form.dueDate } : {}),
          }),
        },
        // With a file attached the upload's toast is the meaningful one.
        file ? {} : { success: "Invoice created" }
      );
      if (!created.ok || !created.data) return;

      if (file) {
        const fd = new FormData();
        fd.set("file", file);
        await mutateForm(`/api/invoices/${created.data.id}/file`, fd, {
          success: "Invoice created with the uploaded PDF",
          error:
            "Invoice created, but the PDF didn't upload — use Attach PDF on it below",
        });
      }

      setForm(EMPTY_FORM);
      setFile(null);
      if (createFileRef.current) createFileRef.current.value = "";
      setShowForm(false);
      load();
    } finally {
      setCreating(false);
    }
  }

  function pickRowFile(invoiceId: number) {
    rowInvoiceIdRef.current = invoiceId;
    rowFileRef.current?.click();
  }

  async function handleRowFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    const invoiceId = rowInvoiceIdRef.current;
    e.target.value = "";
    if (!picked || !invoiceId) return;

    setUploadingRowId(invoiceId);
    try {
      const fd = new FormData();
      fd.set("file", picked);
      const { ok } = await mutateForm(`/api/invoices/${invoiceId}/file`, fd, {
        success: "Invoice PDF uploaded",
      });
      if (ok) load();
    } finally {
      setUploadingRowId(null);
    }
  }

  async function removeRowFile(inv: Row) {
    const confirmed = await confirmAction({
      title: "Remove the uploaded PDF?",
      message: "Downloads go back to the generated invoice document.",
      confirmLabel: "Remove PDF",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/invoices/${inv.id}/file`,
      { method: "DELETE" },
      { success: "Uploaded PDF removed" }
    );
    if (ok) load();
  }

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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Client Portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Invoices</h1>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowForm((s) => !s)}>
              {showForm ? "Close" : "New invoice"}
            </Button>
          )}
        </div>

        {isAdmin && showForm && (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
          >
            <p className="text-sm font-semibold text-white">New invoice</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="inv-client" className={labelClass}>
                  Client
                </label>
                <select
                  id="inv-client"
                  required
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  className={`${inputClass} mt-1`}
                >
                  <option value="">Choose a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company || c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="inv-due" className={labelClass}>
                  Due date <span className="text-slate-600">(default: 14 days)</span>
                </label>
                <input
                  id="inv-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inv-desc" className={labelClass}>
                  Description
                </label>
                <input
                  id="inv-desc"
                  required
                  maxLength={1000}
                  placeholder="e.g. Website build — final milestone"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div>
                <label htmlFor="inv-amount" className={labelClass}>
                  Amount ex GST (AUD)
                </label>
                <input
                  id="inv-amount"
                  required
                  inputMode="decimal"
                  placeholder="450.00"
                  value={form.amountExGst}
                  onChange={(e) => setForm((f) => ({ ...f, amountExGst: e.target.value }))}
                  className={`${inputClass} mt-1`}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {amountValid
                    ? `+ ${formatAUD(gstPreview.toFixed(2))} GST = ${formatAUD((amountNumber + gstPreview).toFixed(2))} total`
                    : "GST (10%) is added automatically."}
                </p>
              </div>
              <div>
                <label htmlFor="inv-file" className={labelClass}>
                  Invoice PDF <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  id="inv-file"
                  ref={createFileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-slate-700"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Uploaded PDFs (e.g. from your accounting software) are what clients download;
                  leave empty to use the generated document.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={creating} disabled={creating}>
                {creating ? "Creating..." : "Create invoice"}
              </Button>
            </div>
          </form>
        )}

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
              const uploaded = inv.documents?.[0];
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
                      {uploaded && (
                        <>
                          {" · "}
                          <span className="text-slate-400" title={uploaded.originalName}>
                            uploaded PDF
                          </span>
                        </>
                      )}
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
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => pickRowFile(inv.id)}
                        disabled={uploadingRowId === inv.id}
                        className="text-xs text-slate-400 hover:text-amber-300 disabled:opacity-50"
                      >
                        {uploadingRowId === inv.id
                          ? "Uploading…"
                          : uploaded
                            ? "Replace PDF"
                            : "Attach PDF"}
                      </button>
                    )}
                    {isAdmin && uploaded && (
                      <button
                        type="button"
                        onClick={() => removeRowFile(inv)}
                        className="text-xs text-slate-500 hover:text-rose-400"
                      >
                        Remove PDF
                      </button>
                    )}
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

      {/* Shared picker for the per-row Attach/Replace PDF buttons. */}
      <input
        ref={rowFileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleRowFile}
      />
    </>
  );
}
