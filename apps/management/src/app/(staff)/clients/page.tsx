"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import NewClientForm from "@/components/NewClientForm";
import { useCurrentUser } from "@/components/layout/Shell";
import { fetchJson } from "@/lib/clientApi";
import {
  CLIENT_STAGE_LABELS,
  CLIENT_STAGE_TONE,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONE,
  type ClientSummary,
} from "@/types";

const GROUP_CHIPS: { value: "workingon" | "workedwith"; label: string }[] = [
  { value: "workingon", label: "Working On" },
  { value: "workedwith", label: "Worked With" },
];

function ClientsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const group = (searchParams.get("group") as "workingon" | "workedwith") || "workingon";
  const stage = searchParams.get("stage");
  const payment = searchParams.get("payment");
  const mvp = searchParams.get("mvp");
  const hasDrilldown = Boolean(stage || payment || mvp);

  const [clients, setClients] = useState<ClientSummary[]>([]);
  const { user: currentUser, loaded: userLoaded } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  // Monotonic request id so a slow response for an old filter can't
  // overwrite the results of a newer one.
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setRefreshing(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (stage) params.set("stage", stage);
    if (payment) params.set("payment", payment);
    if (mvp) params.set("mvp", mvp);
    if (!stage) params.set("group", group);
    const { data, error } = await fetchJson<ClientSummary[]>(`/api/clients?${params.toString()}`);
    if (requestId !== requestRef.current) return; // stale response — ignore
    if (error) {
      setLoadError(error);
    } else {
      setLoadError(null);
      setClients(Array.isArray(data) ? data : []);
    }
    setLoading(false);
    setRefreshing(false);
  }, [q, group, stage, payment, mvp]);

  useEffect(() => {
    load();
  }, [load]);

  function setGroup(next: "workingon" | "workedwith") {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("group", next);
    router.push(`/clients?${params.toString()}`);
  }

  const drilldownLabel = stage
    ? `Stage: ${CLIENT_STAGE_LABELS[stage as keyof typeof CLIENT_STAGE_LABELS] ?? stage}`
    : payment === "outstanding"
    ? "Payment: Awaiting payment"
    : mvp === "pending"
    ? "MVP: Pending client approval"
    : null;

  const isFiltered = Boolean(q) || hasDrilldown;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Clients</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              {q ? `Search results for "${q}"` : drilldownLabel ?? "Client directory"}
            </h1>
          </div>
          {userLoaded && currentUser?.isAdmin && (
            <Button
              variant={showForm ? "secondary" : "primary"}
              onClick={() => setShowForm((s) => !s)}
            >
              {showForm ? "Cancel" : "+ Onboard client"}
            </Button>
          )}
        </div>

        {showForm && currentUser?.isAdmin && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <NewClientForm
              submitLabel="Start onboarding"
              onCreated={() => {
                setShowForm(false);
                load();
              }}
            />
          </div>
        )}

        {hasDrilldown ? (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
            <span className="text-amber-400">Filtered by {drilldownLabel}</span>
            <Link href={q ? `/clients?q=${encodeURIComponent(q)}` : "/clients"} className="text-xs text-slate-400 hover:text-slate-200 underline">
              Clear filter
            </Link>
            {refreshing && !loading && (
              <span className="text-xs text-slate-500 animate-pulse">Updating…</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium">
            {GROUP_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setGroup(chip.value)}
                aria-pressed={group === chip.value}
                className={`rounded-lg px-3 py-1.5 border transition ${
                  group === chip.value
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-transparent"
                }`}
              >
                {chip.label}
              </button>
            ))}
            {refreshing && !loading && (
              <span className="text-xs text-slate-500 animate-pulse">Updating…</span>
            )}
          </div>
        )}

        {loadError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <p className="text-xs text-rose-300">{loadError}</p>
            <Button variant="secondary" onClick={() => load()}>
              Retry
            </Button>
          </div>
        ) : loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : clients.length === 0 ? (
          isFiltered ? (
            <p className="text-sm text-slate-500">
              No clients match this filter.{" "}
              <Link href="/clients" className="text-amber-400 hover:text-amber-300 underline">
                Clear filter
              </Link>
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              {group === "workedwith" ? "No completed clients yet." : "No clients yet."}
            </p>
          )
        ) : (
          <div
            className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 transition-opacity ${
              refreshing ? "opacity-60" : ""
            }`}
          >
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-amber-500/40 transition block"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{client.name}</p>
                    {client.company && (
                      <p className="text-xs text-slate-400">{client.company}</p>
                    )}
                  </div>
                  <Badge label={CLIENT_STAGE_LABELS[client.stage]} tone={CLIENT_STAGE_TONE[client.stage]} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge
                    label={PAYMENT_STATUS_LABELS[client.paymentStatus]}
                    tone={PAYMENT_STATUS_TONE[client.paymentStatus]}
                  />
                  {client.mvpSentAt && (
                    <Badge
                      label={client.mvpApprovedAt ? "MVP Approved" : "MVP Sent"}
                      tone={client.mvpApprovedAt ? "emerald" : "amber"}
                    />
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Tasks completed</span>
                    <span>
                      {client.taskCount - client.openTaskCount}/{client.taskCount}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${
                          client.taskCount === 0
                            ? 0
                            : Math.round(
                                ((client.taskCount - client.openTaskCount) / client.taskCount) * 100
                              )
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={null}>
      <ClientsPageInner />
    </Suspense>
  );
}
