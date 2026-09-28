"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PortalButton from "@/components/portal/ui/PortalButton";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only follow same-origin relative paths — "//evil.com" or "https://..."
  // in ?next= would otherwise be an open redirect.
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/portal/dashboard";
  // accept-invite lands here with ?created=1&email=... after a new account is set up.
  const justCreated = searchParams.get("created") === "1";

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // Set when the account exists but hasn't confirmed its address — the fix is
  // a new link, not a different password, so the form says so.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setSubmitting(true);
    let succeeded = false;
    try {
      const res = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        // Stay disabled through the redirect so a double click can't fire a
        // second login while the router navigates.
        succeeded = true;
        router.push(next);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to log in");
        setNeedsVerification(res.status === 403 && data.needsVerification === true);
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      if (!succeeded) setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 bg-sand-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 shadow-lg shadow-sand-900/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-teal-600 to-coral-500 rounded-xl flex items-center justify-center text-white font-black text-2xl">
            W
          </div>
          <div>
            <p className="font-bold text-lg text-sand-900">WebQuokka</p>
            <p className="text-xs text-sand-600">Client Portal</p>
          </div>
        </div>

        {justCreated && (
          <p className="mt-4 rounded-lg border border-teal-500/30 bg-teal-50 px-3 py-2 text-xs text-teal-700">
            Account created — sign in to continue.
          </p>
        )}

        <div className="mt-6 space-y-3">
          <div>
            <label htmlFor="portal-email" className="block text-xs font-medium text-sand-700">
              Email
            </label>
            <input
              id="portal-email"
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
          <div>
            <label htmlFor="portal-password" className="block text-xs font-medium text-sand-700">
              Password
            </label>
            <input
              id="portal-password"
              name="password"
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* This page sits outside the portal shell, so toasts don't render here — errors stay inline. */}
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-coral-500/40 bg-coral-500/10 px-3 py-2 text-xs text-coral-600">
            {error}
          </p>
        )}

        <PortalButton type="submit" loading={submitting} className="mt-5 w-full">
          {submitting ? "Signing in..." : "Sign in"}
        </PortalButton>

        {needsVerification && (
          <p className="mt-3 text-center text-xs text-sand-600">
            <Link href="/portal/resend-verification" className="text-teal-700 hover:underline">
              Send me a new confirmation link
            </Link>
          </p>
        )}

        <p className="mt-4 text-center text-xs text-sand-600">
          <Link href="/portal/forgot-password" className="text-teal-700 hover:underline">
            Forgot your password?
          </Link>
        </p>

        <p className="mt-3 border-t border-sand-200 pt-3 text-center text-xs text-sand-600">
          New to WebQuokka?{" "}
          <Link href="/portal/signup" className="font-medium text-teal-700 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
