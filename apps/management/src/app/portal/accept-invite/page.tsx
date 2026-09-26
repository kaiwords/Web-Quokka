"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PortalButton from "@/components/portal/ui/PortalButton";

function AcceptInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [invite, setInvite] = useState<{ email: string; role: string; businessName: string } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/portal/auth/accept-invite?token=${encodeURIComponent(token)}`);
        // Guard the parse — an HTML error page must never surface as a raw
        // "Unexpected token" message.
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !data) {
          setLoadError(
            (data && typeof data.error === "string" && data.error) ||
              "This invite link is invalid or has expired."
          );
        } else {
          setInvite(data);
        }
      } catch {
        if (!cancelled) setLoadError("This invite link is invalid or has expired.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }
    setSubmitting(true);
    let succeeded = false;
    try {
      const res = await fetch("/api/portal/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      if (res.ok) {
        // Stay disabled through the redirect; the login page greets them with
        // a "created" note and their email prefilled.
        succeeded = true;
        router.push(`/portal/login?created=1&email=${encodeURIComponent(invite?.email ?? "")}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to accept the invite — please try again.");
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      if (!succeeded) setSubmitting(false);
    }
  }

  if (!token || loadError) {
    return (
      <div className="min-h-full flex items-center justify-center px-4 bg-sand-50">
        <div className="w-full max-w-sm rounded-2xl border border-sand-200 bg-white p-6 shadow-lg shadow-sand-900/5">
          <p className="font-bold text-lg text-sand-900">Invite not valid</p>
          <p className="mt-2 text-sm text-coral-600">
            {loadError || "This invite link is missing its token."}
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
        <div className="w-10 h-10 bg-gradient-to-tr from-teal-600 to-coral-500 rounded-xl flex items-center justify-center text-white font-black text-2xl">
          W
        </div>
        <p className="mt-3 font-bold text-lg text-sand-900">Join {invite?.businessName ?? "your business"}&apos;s portal</p>
        <p className="text-xs text-sand-600 mt-1">
          {invite ? `Setting up ${invite.email} as ${invite.role}` : "Loading invite..."}
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="invite-name" className="block text-xs font-medium text-sand-700">
              Your name
            </label>
            <input
              id="invite-name"
              name="name"
              autoFocus
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="invite-password" className="block text-xs font-medium text-sand-700">
              Choose a password
            </label>
            <input
              id="invite-password"
              name="password"
              required
              type="password"
              minLength={6}
              autoComplete="new-password"
              aria-describedby="invite-password-hint"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none"
            />
            <p id="invite-password-hint" className="mt-1 text-[10px] text-sand-600">
              Min. 6 characters.
            </p>
          </div>
          <div>
            <label htmlFor="invite-confirm" className="block text-xs font-medium text-sand-700">
              Confirm password
            </label>
            <input
              id="invite-confirm"
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

        <PortalButton type="submit" loading={submitting} disabled={submitting || !invite} className="mt-5 w-full">
          {submitting ? "Setting up..." : "Create my account"}
        </PortalButton>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteInner />
    </Suspense>
  );
}
