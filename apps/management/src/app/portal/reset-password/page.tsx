"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PortalButton, { portalButtonClasses } from "@/components/portal/ui/PortalButton";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to reset password — please try again.");
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-full flex items-center justify-center px-4 bg-sand-50">
        <div className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 shadow-lg shadow-sand-900/5">
          <p className="font-bold text-lg text-sand-900">Reset link not valid</p>
          <p className="mt-2 text-sm text-coral-600">
            This reset link is missing its token. Request a fresh one and try again.
          </p>
          <div className="mt-5 space-y-3">
            <Link href="/portal/forgot-password" className={`${portalButtonClasses()} w-full`}>
              Request a new link
            </Link>
            <p className="text-center text-xs text-sand-600">
              <Link href="/login" className="text-teal-700 hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // A clear success card with an explicit action beats an auto-redirect the
  // person may not notice happening.
  if (done) {
    return (
      <div className="min-h-full flex items-center justify-center px-4 bg-sand-50">
        <div className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 shadow-lg shadow-sand-900/5">
          <p className="font-bold text-lg text-sand-900">Password updated</p>
          <p className="mt-2 text-sm text-teal-700">
            Your new password is ready — sign in to continue.
          </p>
          <Link href="/login" className={`${portalButtonClasses()} mt-5 w-full`}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 bg-sand-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 shadow-lg shadow-sand-900/5">
        <p className="font-bold text-lg text-sand-900">Set a new password</p>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="new-password" className="block text-xs font-medium text-sand-700">
              New password
            </label>
            <input
              id="new-password"
              name="new-password"
              autoFocus
              required
              type="password"
              minLength={6}
              autoComplete="new-password"
              aria-describedby="new-password-hint"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none"
            />
            <p id="new-password-hint" className="mt-1 text-[10px] text-sand-600">
              Min. 6 characters.
            </p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-medium text-sand-700">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              required
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* No toast host outside the portal shell — errors stay inline. */}
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-coral-500/40 bg-coral-500/10 px-3 py-2 text-xs text-coral-600">
            {error}
          </p>
        )}

        <PortalButton type="submit" loading={submitting} className="mt-5 w-full">
          {submitting ? "Saving..." : "Save new password"}
        </PortalButton>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
