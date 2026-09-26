"use client";

import { useState } from "react";
import PortalButton from "@/components/portal/ui/PortalButton";
import { usePortalUser } from "@/components/portal/PortalShell";
import { mutate } from "@/lib/clientApi";

const inputClasses =
  "w-full rounded-lg border border-sand-200 px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none";

export default function PortalAccountPage() {
  const { user, loaded } = usePortalUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setSubmitting(true);
    try {
      const { ok } = await mutate(
        "/api/portal/auth/password",
        { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) },
        { success: "Password updated.", error: "The password couldn't be changed — please try again." }
      );
      if (ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="max-w-xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Settings</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-sand-900">Account</h1>
        </div>

        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          {!loaded ? (
            <div aria-hidden="true">
              <div className="h-4 w-40 rounded bg-sand-100 animate-pulse" />
              <div className="mt-2 h-3 w-56 rounded bg-sand-100 animate-pulse" />
              <div className="mt-2 h-3 w-16 rounded bg-sand-100 animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-sm text-sand-800">{user?.name}</p>
              <p className="text-xs text-sand-500">{user?.email}</p>
              <p className="text-xs text-teal-600 mt-1">{user?.role}</p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-sand-200 bg-white p-5 space-y-3">
          <p className="text-sm font-semibold text-sand-900">Change password</p>
          <div>
            <label htmlFor="current-password" className="block text-xs font-medium text-sand-600 mb-1">
              Current password
            </label>
            <input
              id="current-password"
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-xs font-medium text-sand-600 mb-1">
              New password
            </label>
            <input
              id="new-password"
              required
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setMismatch(false);
              }}
              className={inputClasses}
            />
            <p className="mt-1 text-[11px] text-sand-400">Min. 6 characters</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-medium text-sand-600 mb-1">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              required
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setMismatch(false);
              }}
              className={inputClasses}
            />
          </div>
          {mismatch && <p className="text-xs text-coral-600">The new passwords don&apos;t match.</p>}
          <PortalButton type="submit" loading={submitting}>
            Update password
          </PortalButton>
        </form>
      </div>
    </>
  );
}
