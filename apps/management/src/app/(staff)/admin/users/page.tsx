"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AdminNav from "@/components/admin/AdminNav";
import { Input } from "@/components/ui/Field";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { useCurrentUser } from "@/components/layout/Shell";
import { formatDate } from "@/types";

interface UserRow {
  id: number;
  username: string;
  role: string;
  isAdmin: boolean;
  createdAt: string;
}

// Inline role/title editor — saves on Enter or on blur when the value changed,
// Escape reverts. The PATCH endpoint accepts a bare `role` update. Rendered
// with a key that includes the role, so a reload with fresh data remounts it
// instead of needing a sync-state effect.
function RoleCell({ user, onSaved }: { user: UserRow; onSaved: () => void }) {
  const [draft, setDraft] = useState(user.role);
  const [saving, setSaving] = useState(false);

  async function save() {
    const next = draft.trim();
    if (!next || next === user.role) {
      setDraft(user.role);
      return;
    }
    setSaving(true);
    try {
      const { ok } = await mutate(
        `/api/users/${user.id}`,
        { method: "PATCH", body: JSON.stringify({ role: next }) },
        { success: `Role updated for ${user.username}`, error: "Failed to update role" }
      );
      if (ok) onSaved();
      else setDraft(user.role);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Input
      aria-label={`Role / title for ${user.username}`}
      value={draft}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur(); // blur runs the save
        }
        if (e.key === "Escape") setDraft(user.role);
      }}
      className="max-w-40"
    />
  );
}

export default function AdminUsersPage() {
  const { user: me, loaded: meLoaded } = useCurrentUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState({ username: "", password: "", role: "", isAdmin: false });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await fetchJson<UserRow[]>("/api/users");
    if (error) {
      setLoadError(error);
    } else {
      setUsers(data ?? []);
      setLoadError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const { ok } = await mutate(
        "/api/users",
        { method: "POST", body: JSON.stringify(form) },
        { success: `Staff account created for ${form.username}`, error: "Failed to create user" }
      );
      if (ok) {
        setForm({ username: "", password: "", role: "", isAdmin: false });
        load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleAdmin(u: UserRow) {
    const confirmed = await confirmAction(
      u.isAdmin
        ? {
            title: `Revoke admin for ${u.username}?`,
            message:
              "They will lose access to staff accounts, clients and portal access management.",
            confirmLabel: "Revoke admin",
            tone: "danger",
          }
        : {
            title: `Make ${u.username} an admin?`,
            message: "Admins can manage staff accounts, clients and portal access.",
            confirmLabel: "Make admin",
            tone: "default",
          }
    );
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/users/${u.id}`,
      { method: "PATCH", body: JSON.stringify({ isAdmin: !u.isAdmin }) },
      {
        success: u.isAdmin
          ? `Admin access revoked for ${u.username}`
          : `${u.username} is now an admin`,
        error: "Failed to update access",
      }
    );
    if (ok) load();
  }

  async function deleteUser(u: UserRow) {
    const confirmed = await confirmAction({
      title: `Delete ${u.username}'s account?`,
      message: "This removes their staff sign-in. It can't be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/users/${u.id}`,
      { method: "DELETE" },
      { success: `Deleted ${u.username}'s account`, error: "Failed to delete user" }
    );
    if (ok) load();
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Team (staff accounts)</h1>
        </div>

        <AdminNav />

        <form
          onSubmit={handleCreate}
          className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:grid-cols-4"
        >
          <input
            required
            name="username"
            autoComplete="off"
            aria-label="Username / ID"
            placeholder="Username / ID *"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="self-start rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
          />
          <div>
            <input
              required
              type="password"
              minLength={6}
              autoComplete="new-password"
              aria-label="Password"
              aria-describedby="new-user-password-hint"
              placeholder="Password *"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
            />
            <p id="new-user-password-hint" className="mt-1 text-[10px] text-slate-500">
              Min. 6 characters.
            </p>
          </div>
          <input
            aria-label="Role / title"
            placeholder="Role / title (e.g. Developer)"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="self-start rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
          />
          <Button type="submit" loading={creating} className="self-start">
            + Add user
          </Button>

          <div className="sm:col-span-4 flex items-center gap-2 text-xs text-slate-400">
            <input
              id="new-user-admin"
              type="checkbox"
              checked={form.isAdmin}
              onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-amber-500"
            />
            <label htmlFor="new-user-admin">
              Grant admin access (can manage other accounts, independent of the role/title above)
            </label>
          </div>
        </form>

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : loadError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 px-5 py-4">
            <p className="text-xs text-rose-400">{loadError}</p>
            <Button
              variant="secondary"
              onClick={() => {
                setLoading(true);
                load();
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Access</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                      No staff users yet.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === me?.id;
                    return (
                      <tr key={u.id} className="border-b border-slate-800/60 last:border-0">
                        <td className="px-5 py-3 text-slate-200">
                          {u.username}
                          {isSelf && <span className="ml-2 text-[10px] text-slate-500">(you)</span>}
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {me?.isAdmin ? (
                            <RoleCell key={`${u.id}:${u.role}`} user={u} onSaved={load} />
                          ) : (
                            u.role
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {u.isAdmin ? (
                              <Badge label="Admin" tone="amber" />
                            ) : (
                              <Badge label="Standard" tone="slate" />
                            )}
                            {/* No self-toggle — demoting yourself here is a lockout waiting to happen. */}
                            {meLoaded && !isSelf && (
                              <Button variant="secondary" onClick={() => toggleAdmin(u)}>
                                {u.isAdmin ? "Revoke admin" : "Make admin"}
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-3 text-right">
                          {meLoaded && !isSelf && (
                            <button
                              onClick={() => deleteUser(u)}
                              className="text-xs text-slate-500 hover:text-rose-400"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
