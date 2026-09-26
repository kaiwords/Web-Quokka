"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AdminNav from "@/components/admin/AdminNav";
import NewClientForm from "@/components/NewClientForm";
import PortalAccessPanel from "@/components/PortalAccessPanel";
import { fetchJson, mutate } from "@/lib/clientApi";
import { toast } from "@/components/ui/Toaster";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { CLIENT_STAGE_LABELS, CLIENT_STAGE_TONE, type ClientSummary } from "@/types";

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await fetchJson<ClientSummary[]>("/api/clients");
    if (error) {
      setLoadError(error);
    } else {
      setBusinesses(data ?? []);
      setLoadError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteBusiness(b: ClientSummary) {
    const label = b.company || b.name;
    const confirmed = await confirmAction({
      title: `Delete ${label}?`,
      message:
        "This removes the client, its portal users, projects, invoices and uploaded files. It can't be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/clients/${b.id}`,
      { method: "DELETE" },
      { success: `Deleted ${label}`, error: "Failed to delete client" }
    );
    if (ok) {
      if (expandedId === b.id) setExpandedId(null);
      load();
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Admin</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Clients &amp; portal access</h1>
          </div>
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ Add client"}</Button>
        </div>

        <AdminNav />

        {showForm && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <NewClientForm
              submitLabel="Add client"
              onCreated={() => {
                toast.success("Client added");
                setShowForm(false);
                load();
              }}
            />
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : loadError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 px-5 py-4">
            <p className="text-xs text-rose-400">{loadError}</p>
            <Button
              variant="secondary"
              onClick={() => {
                setLoading(true);
                load();
              }}
            >
              Retry
            </Button>
          </div>
        ) : businesses.length === 0 ? (
          <p className="text-sm text-slate-500">No clients yet.</p>
        ) : (
          <div className="space-y-3">
            {businesses.map((b) => {
              const expanded = expandedId === b.id;
              return (
                <div key={b.id} className="rounded-2xl border border-slate-800 bg-slate-900/60">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <Link href={`/clients/${b.id}`} className="text-sm font-medium text-slate-200 hover:text-amber-400">
                        {b.company || b.name}
                      </Link>
                      <p className="text-xs text-slate-500">{b.contactEmail || "No contact email"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge label={CLIENT_STAGE_LABELS[b.stage]} tone={CLIENT_STAGE_TONE[b.stage]} />
                      <button
                        onClick={() => setExpandedId(expanded ? null : b.id)}
                        aria-expanded={expanded}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        {expanded ? "Hide portal access" : "Manage portal access"}
                      </button>
                      <button onClick={() => deleteBusiness(b)} className="text-xs text-slate-500 hover:text-rose-400">
                        Delete
                      </button>
                    </div>
                  </div>
                  {expanded && (
                    <div className="border-t border-slate-800 p-4">
                      <PortalAccessPanel clientId={b.id} isAdmin />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
