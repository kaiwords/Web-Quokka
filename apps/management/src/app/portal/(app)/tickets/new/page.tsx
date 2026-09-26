"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PortalButton, { portalButtonClasses } from "@/components/portal/ui/PortalButton";
import { canAct, usePortalUser } from "@/components/portal/PortalShell";
import { mutate } from "@/lib/clientApi";
import { PORTAL_TICKET_CATEGORY_LABELS, TICKET_PRIORITY_RESPONSE_TIME, type TicketPriority } from "@/types";

// Option text via a label map rather than raw enum values, matching the
// category select. (Candidate for @/types.)
const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Urgent: "Urgent",
};

const INPUT_CLASSES =
  "w-full rounded-lg border border-sand-200 px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none";

export default function NewTicketPage() {
  const router = useRouter();
  const { user, loaded } = usePortalUser();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Bug");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    // Stays disabled through the redirect on success — re-enabling early let
    // a double-click create duplicate tickets.
    let redirecting = false;
    try {
      const { ok, data } = await mutate<{ id: number }>(
        "/api/portal/tickets",
        { method: "POST", body: JSON.stringify({ title, category, priority, description }) },
        { success: "Ticket raised — we're on it!", error: "We couldn't raise your ticket — please try again." }
      );
      if (ok && data?.id) {
        redirecting = true;
        router.push(`/portal/tickets/${data.id}`);
      }
    } finally {
      if (!redirecting) setSubmitting(false);
    }
  }

  return (
    <>
      <div className="max-w-xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Support</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-sand-900">Raise a Ticket</h1>
        </div>

        {loaded && user && !canAct(user) ? (
          <div className="rounded-2xl border border-sand-200 bg-white p-5">
            <p className="text-sm text-sand-700">
              View-only access — an account owner or manager can raise tickets for your business.
            </p>
            <Link href="/portal/tickets" className={`mt-4 ${portalButtonClasses("secondary")}`}>
              Back to tickets
            </Link>
          </div>
        ) : loaded && canAct(user) ? (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-sand-200 bg-white p-5 space-y-4">
            <div>
              <label htmlFor="ticket-title" className="block text-xs font-medium text-sand-600 mb-1">
                Title
              </label>
              <input
                id="ticket-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ticket-category" className="block text-xs font-medium text-sand-600 mb-1">
                  Category
                </label>
                <select
                  id="ticket-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={INPUT_CLASSES}
                >
                  {Object.entries(PORTAL_TICKET_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ticket-priority" className="block text-xs font-medium text-sand-600 mb-1">
                  Priority
                </label>
                <select
                  id="ticket-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className={INPUT_CLASSES}
                >
                  {Object.entries(TICKET_PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-sand-400">
                  We usually respond {TICKET_PRIORITY_RESPONSE_TIME[priority]}.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="ticket-description" className="block text-xs font-medium text-sand-600 mb-1">
                Description
              </label>
              <textarea
                id="ticket-description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            <div className="flex items-center gap-2">
              <PortalButton type="submit" loading={submitting}>
                {submitting ? "Submitting..." : "Submit ticket"}
              </PortalButton>
              <Link href="/portal/tickets" className={portalButtonClasses("secondary")}>
                Cancel
              </Link>
            </div>
          </form>
        ) : null}
      </div>
    </>
  );
}
