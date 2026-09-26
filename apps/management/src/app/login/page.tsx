"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only follow same-origin relative paths — "//evil.com" or "https://..."
  // in ?next= would otherwise be an open redirect.
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    let succeeded = false;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
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
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      if (!succeeded) setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
            W
          </div>
          <div>
            <p className="font-bold text-lg text-white">Web-quokka</p>
            <p className="text-xs text-slate-400">Sign in to continue</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <label htmlFor="login-username" className="block text-xs font-medium text-slate-400">
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
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-slate-400">
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
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* This page sits outside the Shell, so toasts don't render here — errors stay inline. */}
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
            {error}
          </p>
        )}

        <Button type="submit" loading={submitting} className="mt-5 w-full">
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
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
