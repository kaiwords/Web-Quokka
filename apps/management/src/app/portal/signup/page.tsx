"use client";

import { useState } from "react";
import Link from "next/link";
import PortalButton from "@/components/portal/ui/PortalButton";
import { MIN_PASSWORD_LENGTH } from "@/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none";
const labelClass = "block text-xs font-medium text-sand-700";

export default function PortalSignupPage() {
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    password: "",
    confirm: "",
    // Honeypot — hidden from real users, see the signup route.
    website: "",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Checked here purely so the user gets the message without a round trip —
    // the server never receives `confirm` and does its own validation.
    if (form.password !== form.confirm) {
      setError("Those passwords don't match.");
      return;
    }
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          businessName: form.businessName,
          email: form.email,
          password: form.password,
          website: form.website,
        }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not create your account.");
      }
    } catch {
      setError("Network error — check your connection and try again.");
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
            <p className="text-xs text-sand-600">Create your client account</p>
          </div>
        </div>

        {done ? (
          // Says "we sent a link" without confirming the address was new —
          // the route answers identically for an existing account.
          <div className="mt-6">
            <p className="rounded-lg border border-teal-500/30 bg-teal-50 px-3 py-3 text-xs text-teal-700">
              <strong className="block text-sm">Check your inbox</strong>
              We&apos;ve sent a confirmation link to{" "}
              <span className="font-medium">{form.email}</span>. Follow it to activate
              your account — the link expires in 24 hours.
            </p>
            <p className="mt-4 text-center text-xs text-sand-600">
              <Link href="/portal/login" className="text-teal-700 hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mt-6 space-y-3">
              <div>
                <label htmlFor="signup-name" className={labelClass}>
                  Your name
                </label>
                <input
                  id="signup-name"
                  name="name"
                  autoFocus
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="signup-business" className={labelClass}>
                  Business name
                </label>
                <input
                  id="signup-business"
                  name="businessName"
                  required
                  autoComplete="organization"
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="signup-email" className={labelClass}>
                  Work email
                </label>
                <input
                  id="signup-email"
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="signup-password" className={labelClass}>
                  Password
                </label>
                <input
                  id="signup-password"
                  name="password"
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-sand-500">
                  At least {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>
              <div>
                <label htmlFor="signup-confirm" className={labelClass}>
                  Confirm password
                </label>
                <input
                  id="signup-confirm"
                  name="confirm"
                  required
                  type="password"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => set("confirm", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Honeypot: off-screen rather than display:none, which some bots skip. */}
            <div aria-hidden="true" className="absolute left-[-9999px] w-px h-px overflow-hidden">
              <label htmlFor="signup-website">Website</label>
              <input
                id="signup-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-coral-500/40 bg-coral-500/10 px-3 py-2 text-xs text-coral-600"
              >
                {error}
              </p>
            )}

            <PortalButton type="submit" loading={submitting} className="mt-5 w-full">
              {submitting ? "Creating account..." : "Create account"}
            </PortalButton>

            <p className="mt-4 text-center text-xs text-sand-600">
              Already have an account?{" "}
              <Link href="/portal/login" className="text-teal-700 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
