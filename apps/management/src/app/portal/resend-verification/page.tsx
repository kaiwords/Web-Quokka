"use client";

import { useState } from "react";
import Link from "next/link";
import PortalButton from "@/components/portal/ui/PortalButton";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong — please try again.");
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Success replaces the form entirely — a sand-toned line under a live form
  // read like an error and invited a confused resubmit.
  if (sent) {
    return (
      <div className="min-h-full flex items-center justify-center px-4 bg-sand-50">
        <div className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 shadow-lg shadow-sand-900/5">
          <p className="font-bold text-lg text-sand-900">Check your email</p>
          <p className="mt-2 text-sm text-teal-700">
            If that address still needs confirming, a new link is on its way.
          </p>
          <p className="mt-4 text-center text-xs text-sand-600">
            <Link href="/portal/login" className="text-teal-700 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 bg-sand-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 shadow-lg shadow-sand-900/5">
        <p className="font-bold text-lg text-sand-900">Resend confirmation link</p>
        <p className="text-xs text-sand-600 mt-1">We&apos;ll email you a fresh link to confirm your address.</p>

        <div className="mt-4">
          <label htmlFor="resend-email" className="block text-xs font-medium text-sand-700">
            Email
          </label>
          <input
            id="resend-email"
            name="email"
            autoFocus
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* No toast host outside the portal shell — errors stay inline. */}
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-coral-500/40 bg-coral-500/10 px-3 py-2 text-xs text-coral-600">
            {error}
          </p>
        )}

        <PortalButton type="submit" loading={submitting} className="mt-5 w-full">
          {submitting ? "Sending..." : "Send new link"}
        </PortalButton>

        <p className="mt-4 text-center text-xs text-sand-600">
          <Link href="/portal/login" className="text-teal-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
