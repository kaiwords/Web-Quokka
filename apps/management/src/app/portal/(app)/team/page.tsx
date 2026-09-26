"use client";

import { useCallback, useEffect, useState } from "react";
import PortalBadge from "@/components/portal/ui/PortalBadge";
import PortalButton from "@/components/portal/ui/PortalButton";
import { usePortalUser } from "@/components/portal/PortalShell";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { formatDate, type PortalRole } from "@/types";

interface Member {
  id: number;
  name: string;
  email: string;
  role: PortalRole;
  status: string;
  createdAt?: string;
}

interface Invite {
  id: number;
  email: string;
  role: PortalRole;
  createdAt?: string;
  expiresAt?: string;
}

interface TeamPayload {
  members: Member[];
  invites: Invite[];
}

export default function TeamPage() {
  const { user, loaded } = usePortalUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PortalRole>("Viewer");
  const [inviting, setInviting] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState("");

  const isOwner = loaded && user?.role === "Owner";

  // setState only inside the promise callback — never synchronously in the
  // effect that calls this on mount (react-hooks/set-state-in-effect).
  // Calling it after a mutation refreshes in place without a loading flash.
  const load = useCallback(() => {
    return fetchJson<TeamPayload>("/api/portal/team").then((res) => {
      setMembers(res.data?.members ?? []);
      setInvites(res.data?.invites ?? []);
      setError(res.error);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isOwner) void load();
  }, [isOwner, load]);

  function retry() {
    setLoading(true);
    void load();
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (inviting) return;
    setInviting(true);
    setLastInviteUrl("");
    try {
      const { ok, data } = await mutate<{ inviteUrl?: string }>(
        "/api/portal/team",
        { method: "POST", body: JSON.stringify({ email, role }) },
        { success: `Invite sent to ${email}`, error: "The invite couldn't be sent — please try again." }
      );
      if (ok) {
        setEmail("");
        setLastInviteUrl(data?.inviteUrl ?? "");
        await load();
      }
    } finally {
      setInviting(false);
    }
  }

  async function remove(target: { id: number; type: "member" | "invite"; label: string }) {
    const confirmed = await confirmAction(
      target.type === "invite"
        ? { title: `Cancel the invite to ${target.label}?`, confirmLabel: "Cancel invite", tone: "danger" }
        : {
            title: `Remove ${target.label} from your team?`,
            message: "They'll lose access to this portal straight away.",
            confirmLabel: "Remove",
            tone: "danger",
          }
    );
    if (!confirmed) return;

    setRemovingKey(`${target.type}-${target.id}`);
    try {
      const { ok } = await mutate(
        `/api/portal/team/${target.id}?type=${target.type}`,
        { method: "DELETE" },
        { success: target.type === "invite" ? "Invite cancelled." : `${target.label} has been removed.` }
      );
      if (ok) await load();
    } finally {
      setRemovingKey(null);
    }
  }

  if (!loaded) {
    return (
      <>
        <p className="text-sm text-sand-600">Loading...</p>
      </>
    );
  }

  // The nav only shows Team to Owners, but guard in-page too for direct URLs.
  if (!isOwner) {
    return (
      <>
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <p className="text-sm text-sand-700">Only the account owner can manage the team.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Team</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-sand-900">Manage your team</h1>
        </div>

        <form onSubmit={invite} className="rounded-2xl border border-sand-200 bg-white p-5 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-45">
            <label htmlFor="invite-email" className="block text-xs font-medium text-sand-600 mb-1">
              Email
            </label>
            <input
              id="invite-email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-sand-200 px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="invite-role" className="block text-xs font-medium text-sand-600 mb-1">
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as PortalRole)}
              className="rounded-lg border border-sand-200 px-3 py-1.5 text-sm text-sand-900 focus:border-teal-500 focus:outline-none"
            >
              <option value="Viewer">Viewer</option>
              <option value="Manager">Manager</option>
              <option value="Owner">Owner</option>
            </select>
          </div>
          <PortalButton type="submit" loading={inviting}>
            Invite
          </PortalButton>
        </form>
        {lastInviteUrl && (
          <p className="text-xs text-sand-600">
            Invite link (email not yet configured — share this manually): <span className="font-mono text-teal-700">{lastInviteUrl}</span>
          </p>
        )}

        {loading ? (
          <p className="text-sm text-sand-600">Loading...</p>
        ) : error ? (
          <div className="rounded-2xl border border-coral-500/30 bg-white p-5">
            <p className="text-sm text-coral-600">{error}</p>
            <PortalButton variant="secondary" className="mt-3" onClick={retry}>
              Try again
            </PortalButton>
          </div>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-white divide-y divide-sand-100">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-sand-800">{m.name}</p>
                  <p className="text-xs text-sand-500">
                    {m.email}
                    {m.createdAt && ` · joined ${formatDate(m.createdAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PortalBadge label={m.role} tone="teal" />
                  {m.status === "Disabled" && <PortalBadge label="Access revoked by WebQuokka" tone="rose" />}
                  {user && m.id !== user.id && (
                    <button
                      onClick={() => void remove({ id: m.id, type: "member", label: m.name || m.email })}
                      disabled={removingKey !== null}
                      className="text-xs text-coral-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {removingKey === `member-${m.id}` ? "Removing..." : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {invites.map((i) => (
              <div key={`invite-${i.id}`} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-sand-800">{i.email}</p>
                  <p className="text-xs text-sand-500">
                    Pending invite
                    {i.createdAt && ` · sent ${formatDate(i.createdAt)}`}
                    {i.expiresAt && ` · expires ${formatDate(i.expiresAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PortalBadge label={i.role} tone="amber" />
                  <button
                    onClick={() => void remove({ id: i.id, type: "invite", label: i.email })}
                    disabled={removingKey !== null}
                    className="text-xs text-coral-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {removingKey === `invite-${i.id}` ? "Cancelling..." : "Cancel"}
                  </button>
                </div>
              </div>
            ))}
            {members.length === 0 && invites.length === 0 && (
              <p className="p-4 text-xs text-sand-500">No team members yet — send an invite above.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
