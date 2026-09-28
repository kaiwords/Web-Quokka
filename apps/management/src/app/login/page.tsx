"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PortalButton from "@/components/portal/ui/PortalButton";

type Tab = "client" | "staff";

const inputClass =
  "mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-sand-900 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";
const labelClass = "block text-xs font-medium text-sand-700";

/**
 * The one login for everything. Clients and staff both sign in here — there
 * are no alternate login entry points (/portal/login redirects to this page).
 * The two account systems stay fully separate behind it: the Client tab posts
 * to the portal's auth API and cookie, the Staff tab to the CRM's.
 */
function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Only follow same-origin relative paths — "//evil.com", "https://..." or
  // "/\evil.com" in ?next= would otherwise be an open redirect (the URL spec
  // treats a backslash like a forward slash, so "/\evil.com" resolves to
  // https://evil.com).
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\")
      ? rawNext
      : "";
  const nextIsPortal = next === "/portal" || next.startsWith("/portal/");

  // accept-invite lands here with ?created=1&email=... after a new account is
  // set up — that is always a portal account.
  const justCreated = searchParams.get("created") === "1";

  // Where they were headed decides which tab greets them; clients are the
  // common case, so an aimless visit starts on the Client tab.
  const [tab, setTab] = useState<Tab>(() => {
    const wanted = searchParams.get("tab");
    if (wanted === "staff" || wanted === "client") return wanted;
    if (justCreated) return "client";
    if (next && !nextIsPortal) return "staff";
    return "client";
  });

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // Set when the portal account exists but hasn't confirmed its address — the
  // fix is a new link, not a different password, so the form says so.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function switchTab(nextTab: Tab) {
    if (nextTab === tab) return;
    setTab(nextTab);
    setError("");
    setNeedsVerification(false);
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setSubmitting(true);
    let succeeded = false;
    try {
      const isClient = tab === "client";
      const res = await fetch(isClient ? "/api/portal/auth/login" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isClient ? { email, password } : { username, password }),
      });
      if (res.ok) {
        // Stay disabled through the redirect so a double click can't fire a
        // second login while the router navigates. `next` only follows the
        // login that can actually open it.
        succeeded = true;
        const fallback = isClient ? "/portal/dashboard" : "/dashboard";
        const destination = isClient
          ? nextIsPortal
            ? next
            : fallback
          : next && !nextIsPortal
            ? next
            : fallback;
        router.push(destination);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to log in");
        setNeedsVerification(
          isClient && res.status === 403 && data.needsVerification === true
        );
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      if (!succeeded) setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10 bg-sand-50">
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-sand-200 bg-white p-6 shadow-lg shadow-sand-900/5"
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static brand asset */}
            <img src="/brand/mascot-brown.png" alt="Web Quokka" className="w-10 h-10 object-contain" />
            <div>
              <p className="font-bold text-lg text-sand-900">Web Quokka</p>
              <p className="text-xs text-sand-600">
                {tab === "client" ? "Client Portal — sign in" : "Staff CRM — sign in"}
              </p>
            </div>
          </div>

          <div
            className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-sand-100 p-1"
            role="tablist"
            aria-label="Account type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "client"}
              onClick={() => switchTab("client")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === "client"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-sand-600 hover:text-sand-800"
              }`}
            >
              Client Portal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "staff"}
              onClick={() => switchTab("staff")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === "staff"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-sand-600 hover:text-sand-800"
              }`}
            >
              Staff
            </button>
          </div>

          {justCreated && tab === "client" && (
            <p className="mt-4 rounded-lg border border-teal-500/30 bg-teal-50 px-3 py-2 text-xs text-teal-700">
              Account created — sign in to continue.
            </p>
          )}

          <div className="mt-5 space-y-3">
            {tab === "client" ? (
              <div>
                <label htmlFor="login-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  autoFocus
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="login-username" className={labelClass}>
                  Username
                </label>
                <input
                  id="login-username"
                  name="username"
                  autoFocus
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label htmlFor="login-password" className={labelClass}>
                Password
              </label>
              <input
                id="login-password"
                name="password"
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* This page sits outside both shells, so toasts don't render here —
              errors stay inline. */}
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-coral-500/40 bg-coral-500/10 px-3 py-2 text-xs text-coral-600"
            >
              {error}
            </p>
          )}

          <PortalButton type="submit" loading={submitting} className="mt-5 w-full py-2 text-sm">
            {submitting ? "Signing in..." : "Sign in"}
          </PortalButton>

          {tab === "client" ? (
            <>
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
                New to Web Quokka?{" "}
                <Link href="/portal/signup" className="font-medium text-teal-700 hover:underline">
                  Create an account
                </Link>
              </p>
            </>
          ) : (
            <p className="mt-4 border-t border-sand-200 pt-3 text-center text-xs text-sand-600">
              Staff accounts are created by an administrator — there is no public
              staff sign-up.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
