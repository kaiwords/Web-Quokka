"use client";

import { useCallback, useEffect, useState } from "react";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton from "@/components/portal/ui/PortalButton";
import { fetchJson } from "@/lib/clientApi";
import { formatDate, type Service } from "@/types";

export default function PortalServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // setState only inside the promise callback — never synchronously in the
  // effect that calls this on mount (react-hooks/set-state-in-effect).
  const load = useCallback(() => {
    return fetchJson<Service[]>("/api/portal/services").then((res) => {
      setServices(res.data ?? []);
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
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">My Services</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-sand-900">What&apos;s running your site</h1>
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
        ) : services.length === 0 ? (
          <p className="text-sm text-sand-500">No services on file yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <div key={s.id} className="rounded-2xl border border-sand-200 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sand-900">{s.type}</p>
                  <PortalBadge label={s.provider} tone="teal" />
                </div>
                {s.planName && <p className="mt-2 text-sm text-sand-700">{s.planName}</p>}
                {s.notes && <p className="mt-1 text-xs text-sand-500">{s.notes}</p>}
                {s.createdAt && <p className="mt-2 text-[11px] text-sand-400">On file since {formatDate(s.createdAt)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
