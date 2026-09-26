"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { useCurrentUser } from "@/components/layout/Shell";
import { fetchJson, mutate } from "@/lib/clientApi";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_TONE,
  ENQUIRY_TYPE_TONE,
  formatDateTime,
  type Enquiry,
  type EnquiryStatus,
} from "@/types";

const CHIP_BASE = "rounded-lg px-3 py-1.5 border transition";
const CHIP_ACTIVE = "bg-amber-500/15 text-amber-400 border-amber-500/50";
const CHIP_INACTIVE = "text-slate-400 hover:text-slate-200 border-transparent";

// Contact and quote submissions from the public marketing site (apps/web).
// An enquiry is a stranger, not a client — "Convert" is what promotes one
// into the CRM proper.
export default function EnquiriesPage() {
  const router = useRouter();
  const { user } = useCurrentUser();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "all">("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetchJson<Enquiry[]>("/api/enquiries");
    setEnquiries(Array.isArray(res.data) ? res.data : []);
    setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: number, status: EnquiryStatus) {
    setBusyId(id);
    const { ok } = await mutate(
      `/api/enquiries/${id}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      { success: `Marked ${status.toLowerCase()}`, error: "Failed to update enquiry" }
    );
    setBusyId(null);
    if (ok) load();
  }

  async function convert(enquiry: Enquiry) {
    const confirmed = await confirmAction({
      title: "Convert to client?",
      message: `This creates a new client record for "${enquiry.business || enquiry.name}" and copies the enquiry details into its notes.`,
      confirmLabel: "Create client",
    });
    if (!confirmed) return;

    setBusyId(enquiry.id);
    const { ok, data } = await mutate<{ clientId: number }>(
      `/api/enquiries/${enquiry.id}`,
      { method: "PATCH", body: JSON.stringify({ convert: true }) },
      { success: "Client created", error: "Failed to convert enquiry" }
    );
    setBusyId(null);
    if (ok && data?.clientId) router.push(`/clients/${data.clientId}`);
  }

  async function remove(enquiry: Enquiry) {
    const confirmed = await confirmAction({
      title: "Delete this enquiry?",
      message: `"${enquiry.name}" will be permanently removed. Use Archive instead if you might need it later.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;

    setBusyId(enquiry.id);
    const { ok } = await mutate(
      `/api/enquiries/${enquiry.id}`,
      { method: "DELETE" },
      { success: "Enquiry deleted", error: "Failed to delete enquiry" }
    );
    setBusyId(null);
    if (ok) load();
  }

  const visible =
    statusFilter === "all" ? enquiries : enquiries.filter((e) => e.status === statusFilter);
  const newCount = enquiries.filter((e) => e.status === "New").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Website Enquiries</h1>
          <p className="text-xs text-slate-500">
            Contact and quote requests submitted from webquokka.com.au
          </p>
        </div>
        {newCount > 0 && <Badge label={`${newCount} new`} tone="sky" />}
      </div>

      <div className="flex flex-wrap gap-1 text-xs font-medium">
        {(["all", ...ENQUIRY_STATUSES] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`${CHIP_BASE} ${statusFilter === status ? CHIP_ACTIVE : CHIP_INACTIVE}`}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-xs text-slate-500">Loading enquiries...</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-xs text-slate-500">
          {enquiries.length === 0
            ? "No enquiries yet. Submissions from the website's contact and quote forms land here."
            : `No ${statusFilter === "all" ? "" : statusFilter.toLowerCase() + " "}enquiries.`}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((enquiry) => (
            <li
              key={enquiry.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100">{enquiry.name}</p>
                    <Badge label={enquiry.type} tone={ENQUIRY_TYPE_TONE[enquiry.type]} />
                    <Badge label={enquiry.status} tone={ENQUIRY_STATUS_TONE[enquiry.status]} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {enquiry.business && <span>{enquiry.business} &middot; </span>}
                    <a href={`mailto:${enquiry.email}`} className="hover:text-slate-200">
                      {enquiry.email}
                    </a>
                    {enquiry.phone && (
                      <>
                        {" "}
                        &middot;{" "}
                        <a href={`tel:${enquiry.phone}`} className="hover:text-slate-200">
                          {enquiry.phone}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <p className="shrink-0 text-[11px] text-slate-500">
                  {formatDateTime(enquiry.createdAt)}
                </p>
              </div>

              {(enquiry.service || enquiry.budget) && (
                <p className="mt-2 text-xs text-slate-400">
                  {enquiry.service && (
                    <>
                      <span className="text-slate-500">Service:</span> {enquiry.service}
                    </>
                  )}
                  {enquiry.service && enquiry.budget && " · "}
                  {enquiry.budget && (
                    <>
                      <span className="text-slate-500">Budget:</span> {enquiry.budget}
                    </>
                  )}
                </p>
              )}

              {enquiry.message && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
                  {enquiry.message}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {enquiry.status === "New" && (
                  <Button
                    variant="secondary"
                    loading={busyId === enquiry.id}
                    onClick={() => setStatus(enquiry.id, "Contacted")}
                  >
                    Mark contacted
                  </Button>
                )}
                {enquiry.convertedClientId === null ? (
                  <Button
                    variant="success"
                    loading={busyId === enquiry.id}
                    onClick={() => convert(enquiry)}
                  >
                    Convert to client
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/clients/${enquiry.convertedClientId}`)}
                  >
                    View client &rarr;
                  </Button>
                )}
                {enquiry.status !== "Archived" && enquiry.status !== "Converted" && (
                  <Button
                    variant="ghost"
                    loading={busyId === enquiry.id}
                    onClick={() => setStatus(enquiry.id, "Archived")}
                  >
                    Archive
                  </Button>
                )}
                {user?.isAdmin && (
                  <Button
                    variant="danger"
                    loading={busyId === enquiry.id}
                    onClick={() => remove(enquiry)}
                    className="ml-auto"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
