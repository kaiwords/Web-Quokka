"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { portalButtonClasses } from "@/components/portal/ui/PortalButton";

type State = "working" | "ok" | "failed";

function VerifyEmailInner() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [state, setState] = useState<State>("working");
  const [error, setError] = useState("");
  // React runs effects twice in dev StrictMode; the token is single-use, so a
  // second POST would report "already used" and fail a verification that
  // actually succeeded.
  const started = useRef(false);

  const verify = useCallback(async () => {
    if (!token) {
      setState("failed");
      setError("This link is missing its confirmation token.");
      return;
    }
    try {
      const res = await fetch("/api/portal/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setState("ok");
        // Confirming signs them in, so go straight to the portal.
        router.refresh();
        setTimeout(() => router.push("/portal/dashboard"), 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        setState("failed");
        setError(data.error || "This confirmation link is invalid or has expired.");
      }
    } catch {
      setState("failed");
      setError("Network error — check your connection and try again.");
    }
  }, [token, router]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void verify();
  }, [verify]);

  return (
    <div className="min-h-full flex items-center justify-center px-4 bg-sand-50">
      <div className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 text-center shadow-lg shadow-sand-900/5">
        <div className="mx-auto w-10 h-10 bg-gradient-to-tr from-teal-600 to-coral-500 rounded-xl flex items-center justify-center text-white font-black text-2xl">
          W
        </div>

        {state === "working" && (
          <p className="mt-5 text-sm text-sand-600" role="status">
            Confirming your email address...
          </p>
        )}

        {state === "ok" && (
          <>
            <p className="mt-5 text-sm font-semibold text-sand-900">Email confirmed</p>
            <p className="mt-1 text-xs text-sand-600">Taking you to your portal...</p>
          </>
        )}

        {state === "failed" && (
          <>
            <p role="alert" className="mt-5 rounded-lg border border-coral-500/40 bg-coral-500/10 px-3 py-2 text-xs text-coral-600">
              {error}
            </p>
            <p className="mt-4 text-xs text-sand-600">
              Confirmation links expire after 24 hours and can only be used once.
            </p>
            <Link
              href="/portal/resend-verification"
              className={`${portalButtonClasses()} mt-4 w-full`}
            >
              Send me a new link
            </Link>
            <p className="mt-4 text-center text-xs text-sand-600">
              <Link href="/portal/login" className="text-teal-700 hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PortalVerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
