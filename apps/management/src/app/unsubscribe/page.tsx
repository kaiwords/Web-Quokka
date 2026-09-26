"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PortalButton from "@/components/portal/ui/PortalButton";

type State = "loading" | "ready" | "done" | "invalid";

// Landing page for the unsubscribe link in newsletter emails. Client-facing, so
// it wears the portal's light palette rather than the staff CRM's dark one.
//
// It confirms rather than acting on load: the address is shown first, and the
// state change is a POST from a button. A GET that unsubscribed on sight would
// fire for every mail scanner that follows links.
function UnsubscribeInner() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setError("This unsubscribe link is missing its token.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/public/unsubscribe?token=${encodeURIComponent(token)}`
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setState("invalid");
          setError(data.error || "This unsubscribe link is not valid.");
          return;
        }
        setEmail(data.email ?? "");
        // Already off the list — say so instead of offering a no-op button.
        setState(data.alreadyUnsubscribed ? "done" : "ready");
      } catch {
        if (cancelled) return;
        setState("invalid");
        setError("Network error — please try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function unsubscribe() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("done");
      } else {
        setError(data.error || "Could not unsubscribe. Please try again.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10 bg-sand-50">
      <div className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 shadow-lg shadow-sand-900/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-teal-600 to-coral-500 rounded-xl flex items-center justify-center text-white font-black text-2xl">
            W
          </div>
          <div>
            <p className="font-bold text-lg text-sand-900">WebQuokka</p>
            <p className="text-xs text-sand-600">Email preferences</p>
          </div>
        </div>

        {state === "loading" && (
          <p className="mt-6 text-sm text-sand-600" role="status">
            Checking your link...
          </p>
        )}

        {state === "ready" && (
          <>
            <p className="mt-6 text-sm text-sand-700">
              Unsubscribe <span className="font-medium text-sand-900">{email}</span> from
              WebQuokka emails?
            </p>
            <p className="mt-1 text-xs text-sand-500">
              You&apos;ll stop receiving our newsletter. This won&apos;t affect emails
              about your projects or invoices.
            </p>
            {error && (
              <p role="alert" className="mt-3 rounded-lg border border-coral-500/40 bg-coral-500/10 px-3 py-2 text-xs text-coral-600">
                {error}
              </p>
            )}
            <PortalButton onClick={unsubscribe} loading={submitting} className="mt-5 w-full">
              {submitting ? "Unsubscribing..." : "Unsubscribe me"}
            </PortalButton>
          </>
        )}

        {state === "done" && (
          <p className="mt-6 rounded-lg border border-teal-500/30 bg-teal-50 px-3 py-3 text-xs text-teal-700">
            <strong className="block text-sm">You&apos;re unsubscribed</strong>
            {email || "That address"} won&apos;t receive our newsletter any more. You can
            resubscribe any time from our website.
          </p>
        )}

        {state === "invalid" && (
          <p role="alert" className="mt-6 rounded-lg border border-coral-500/40 bg-coral-500/10 px-3 py-2 text-xs text-coral-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeInner />
    </Suspense>
  );
}
