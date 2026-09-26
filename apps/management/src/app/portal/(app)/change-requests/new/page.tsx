"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PortalButton, { portalButtonClasses } from "@/components/portal/ui/PortalButton";
import { canAct, usePortalUser } from "@/components/portal/PortalShell";
import { fetchJson, mutate } from "@/lib/clientApi";

const INPUT_CLASSES =
  "w-full rounded-lg border border-sand-200 px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none";

interface ProjectOption {
  id: number;
  name: string;
}

// Local-timezone yyyy-mm-dd (toISOString is UTC, which can land a day early
// for Australian users and let them pick "yesterday").
function localIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function NewChangeRequestPage() {
  const router = useRouter();
  const { user, loaded } = usePortalUser();
  const [title, setTitle] = useState("");
  const [pageSection, setPageSection] = useState("");
  const [description, setDescription] = useState("");
  const [referenceLinks, setReferenceLinks] = useState("");
  const [desiredDeadline, setDesiredDeadline] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Optional nicety: if the client has projects, offer to link the request
  // to one. A failed load just means no picker — never an error here.
  useEffect(() => {
    let cancelled = false;
    fetchJson<ProjectOption[]>("/api/portal/projects").then(({ data }) => {
      if (!cancelled && Array.isArray(data)) setProjects(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = localIsoDate(new Date());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    // Stays disabled through the redirect on success — re-enabling early let
    // a double-click submit the same request twice.
    let redirecting = false;
    try {
      const { ok, data } = await mutate<{ id: number }>(
        "/api/portal/change-requests",
        {
          method: "POST",
          body: JSON.stringify({
            title,
            pageSection,
            description,
            referenceLinks,
            desiredDeadline: desiredDeadline || null,
            projectId: projectId ? Number(projectId) : undefined,
          }),
        },
        { success: "Change request submitted — we'll take a look shortly.", error: "We couldn't submit your request — please try again." }
      );
      if (ok && data?.id) {
        redirecting = true;
        router.push(`/portal/change-requests/${data.id}`);
      }
    } finally {
      if (!redirecting) setSubmitting(false);
    }
  }

  return (
    <>
      <div className="max-w-xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Requests</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-sand-900">Request a Change</h1>
        </div>

        {loaded && user && !canAct(user) ? (
          <div className="rounded-2xl border border-sand-200 bg-white p-5">
            <p className="text-sm text-sand-700">
              View-only access — an account owner or manager can submit change requests for your business.
            </p>
            <Link href="/portal/change-requests" className={`mt-4 ${portalButtonClasses("secondary")}`}>
              Back to change requests
            </Link>
          </div>
        ) : loaded && canAct(user) ? (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-sand-200 bg-white p-5 space-y-4">
            <div>
              <label htmlFor="cr-title" className="block text-xs font-medium text-sand-600 mb-1">
                What do you want changed?
              </label>
              <input id="cr-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT_CLASSES} />
            </div>
            <div>
              <label htmlFor="cr-page-section" className="block text-xs font-medium text-sand-600 mb-1">
                Which page/section?
              </label>
              <input id="cr-page-section" value={pageSection} onChange={(e) => setPageSection(e.target.value)} className={INPUT_CLASSES} />
            </div>
            {projects.length > 0 && (
              <div>
                <label htmlFor="cr-project" className="block text-xs font-medium text-sand-600 mb-1">
                  Related project (optional)
                </label>
                <select id="cr-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={INPUT_CLASSES}>
                  <option value="">No specific project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="cr-description" className="block text-xs font-medium text-sand-600 mb-1">
                Why / more detail
              </label>
              <textarea
                id="cr-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>
            <div>
              <label htmlFor="cr-links" className="block text-xs font-medium text-sand-600 mb-1">
                Reference links (optional)
              </label>
              <input id="cr-links" value={referenceLinks} onChange={(e) => setReferenceLinks(e.target.value)} className={INPUT_CLASSES} />
            </div>
            <div>
              <label htmlFor="cr-deadline" className="block text-xs font-medium text-sand-600 mb-1">
                Desired deadline (optional)
              </label>
              <input
                id="cr-deadline"
                type="date"
                min={today}
                value={desiredDeadline}
                onChange={(e) => setDesiredDeadline(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            <div className="flex items-center gap-2">
              <PortalButton type="submit" loading={submitting}>
                {submitting ? "Submitting..." : "Submit request"}
              </PortalButton>
              <Link href="/portal/change-requests" className={portalButtonClasses("secondary")}>
                Cancel
              </Link>
            </div>
          </form>
        ) : null}
      </div>
    </>
  );
}
