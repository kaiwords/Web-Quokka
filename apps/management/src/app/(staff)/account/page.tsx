"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { mutate } from "@/lib/clientApi";
import { toast } from "@/components/ui/Toaster";
import { useCurrentUser } from "@/components/layout/Shell";

export default function AccountPage() {
  const { user, loaded } = useCurrentUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setSubmitting(true);
    try {
      const { ok } = await mutate(
        "/api/auth/password",
        {
          method: "PATCH",
          body: JSON.stringify({ currentPassword, newPassword }),
        },
        { error: "Failed to change password" }
      );
      if (ok) {
        toast.success("Password updated");
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
      <div className="max-w-md space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Settings</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Your account</h1>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-white">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Username</dt>
              <dd className="text-slate-200">{loaded ? (user?.username ?? "—") : "..."}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Role / title</dt>
              <dd className="text-slate-200">{loaded ? (user?.role || "—") : "..."}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Access level</dt>
              {/* Wait for /api/auth/me — showing "Standard" to an admin mid-load reads as a demotion. */}
              <dd className="text-slate-200">{loaded ? (user?.isAdmin ? "Admin" : "Standard") : "..."}</dd>
            </div>
          </dl>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <h2 className="text-sm font-semibold text-white">Change password</h2>
          <div>
            <label htmlFor="current-password" className="block text-xs font-medium text-slate-400">
              Current password
            </label>
            <Input
              id="current-password"
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-xs font-medium text-slate-400">
              New password
            </label>
            <Input
              id="new-password"
              required
              type="password"
              minLength={6}
              autoComplete="new-password"
              aria-describedby="new-password-hint"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1"
            />
            <p id="new-password-hint" className="mt-1 text-[10px] text-slate-500">
              Min. 6 characters.
            </p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-medium text-slate-400">
              Confirm new password
            </label>
            <Input
              id="confirm-password"
              required
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            Update password
          </Button>
        </form>
      </div>
    </>
  );
}
