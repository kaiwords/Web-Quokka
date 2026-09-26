"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { Input, Select } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";
import { fetchJson, mutate } from "@/lib/clientApi";
import type { PortalRole, PortalUserStatus } from "@/types";

interface Member {
  id: number;
  name: string;
  email: string;
  role: PortalRole;
  status: PortalUserStatus;
}

interface PendingInvite {
  id: number;
  email: string;
  role: PortalRole;
}

interface Props {
  clientId: number;
  isAdmin: boolean;
}

// Text-style row actions share one focus/hover treatment so keyboard users
// can see where they are.
const LINK_BUTTON =
  "rounded text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2";

// Who can sign in to one business's client portal. Anyone on staff can see
// it; only admins can grant (invite / restore), revoke, or remove access —
// the API enforces that, this just hides controls that would 403.
export default function PortalAccessPanel({ clientId, isAdmin }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "Viewer" as PortalRole });
  const [inviting, setInviting] = useState(false);
  const [copyingInviteId, setCopyingInviteId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await fetchJson<{ members?: Member[]; invites?: PendingInvite[] }>(
      `/api/clients/${clientId}/portal-users`
    );
    if (error) {
      setLoadError(error);
    } else {
      setLoadError(null);
      setMembers(data?.members || []);
      setInvites(data?.invites || []);
    }
    setLoaded(true);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (inviting) return;
    setInviting(true);
    setLastInviteUrl("");
    try {
      const { ok, data } = await mutate<{ inviteUrl?: string }>(
        `/api/clients/${clientId}/portal-users`,
        { method: "POST", body: JSON.stringify(inviteForm) },
        { success: "Invite created", error: "Failed to send invite" }
      );
      if (ok) {
        setInviteForm({ email: "", role: "Viewer" });
        setLastInviteUrl(data?.inviteUrl || "");
        load();
      }
    } finally {
      setInviting(false);
    }
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link — please select and copy it manually.");
    }
  }

  /** The POST endpoint returns the existing invite (and its URL) when one is
   *  already pending for this email, so "copy the link again" is just a
   *  re-submit of the same email + role. */
  async function copyPendingInviteLink(invite: PendingInvite) {
    if (copyingInviteId !== null) return;
    setCopyingInviteId(invite.id);
    try {
      const { ok, data } = await mutate<{ inviteUrl?: string }>(
        `/api/clients/${clientId}/portal-users`,
        { method: "POST", body: JSON.stringify({ email: invite.email, role: invite.role }) },
        { error: "Failed to fetch the invite link" }
      );
      if (!ok) return;
      if (!data?.inviteUrl) {
        toast.error("The server didn't return an invite link.");
        return;
      }
      try {
        await navigator.clipboard.writeText(data.inviteUrl);
        toast.success("Invite link copied");
      } catch {
        // Clipboard access can be blocked — surface the URL for manual copy.
        setLastInviteUrl(data.inviteUrl);
        toast.error("Couldn't copy the link — it's shown below so you can copy it manually.");
      }
      // The invite may have been re-issued (e.g. the old one expired) — keep
      // the listed ids in sync.
      load();
    } finally {
      setCopyingInviteId(null);
    }
  }

  async function setAccess(member: Member, status: PortalUserStatus) {
    if (status === "Disabled") {
      const confirmed = await confirmAction({
        title: `Revoke ${member.name}'s portal access?`,
        message: "They will be signed out immediately. You can restore their access later.",
        confirmLabel: "Revoke access",
        tone: "danger",
      });
      if (!confirmed) return;
    }
    const { ok } = await mutate(
      `/api/clients/${clientId}/portal-users/${member.id}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      {
        success: status === "Disabled" ? "Access revoked" : "Access restored",
        error: "Failed to update access",
      }
    );
    if (ok) load();
  }

  async function remove(member: Member) {
    const confirmed = await confirmAction({
      title: `Delete ${member.name}'s portal account?`,
      message:
        "This permanently removes their account and cannot be undone. Use “Revoke access” instead if you want to keep the account.",
      confirmLabel: "Delete account",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/clients/${clientId}/portal-users/${member.id}`,
      { method: "DELETE" },
      { success: "Portal account deleted", error: "Failed to remove portal user" }
    );
    if (ok) load();
  }

  async function cancelInvite(id: number) {
    const confirmed = await confirmAction({
      title: "Cancel this invite?",
      message: "The invite link will stop working immediately.",
      confirmLabel: "Cancel invite",
      cancelLabel: "Keep invite",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/clients/${clientId}/portal-invites/${id}`,
      { method: "DELETE" },
      { success: "Invite cancelled", error: "Failed to cancel invite" }
    );
    if (ok) load();
  }

  return (
    <div>
      <div className="space-y-2">
        {!loaded && <p className="text-xs text-slate-500">Loading portal users...</p>}
        {loaded && loadError && (
          <p className="text-xs text-rose-400">
            {loadError}{" "}
            <button
              type="button"
              onClick={() => load()}
              className={`${LINK_BUTTON} underline text-rose-300 hover:text-rose-200 focus-visible:outline-rose-400`}
            >
              Retry
            </button>
          </p>
        )}
        {loaded && !loadError && members.length === 0 && invites.length === 0 && (
          <p className="text-xs text-slate-500">No portal users yet.</p>
        )}
        {members.map((m) => {
          const revoked = m.status === "Disabled";
          return (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div>
                <p className={`text-sm ${revoked ? "text-slate-500" : "text-slate-200"}`}>
                  {m.name} <span className="text-xs text-slate-500">({m.email})</span>
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge label={m.role} tone="amber" />
                  {revoked ? <Badge label="Access revoked" tone="rose" /> : <Badge label="Active" tone="emerald" />}
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-3">
                  {revoked ? (
                    <button
                      onClick={() => setAccess(m, "Active")}
                      className={`${LINK_BUTTON} text-emerald-400 hover:text-emerald-300 focus-visible:outline-emerald-400`}
                    >
                      Restore access
                    </button>
                  ) : (
                    <button
                      onClick={() => setAccess(m, "Disabled")}
                      className={`${LINK_BUTTON} text-amber-400 hover:text-amber-300 focus-visible:outline-amber-400`}
                    >
                      Revoke access
                    </button>
                  )}
                  <button
                    onClick={() => remove(m)}
                    className={`${LINK_BUTTON} text-slate-500 hover:text-rose-400 focus-visible:outline-rose-400`}
                  >
                    Delete account
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {invites.map((i) => (
          <div key={`invite-${i.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <div>
              <p className="text-sm text-slate-200">{i.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge label={i.role} tone="amber" />
                <Badge label="Invited" tone="slate" />
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => copyPendingInviteLink(i)}
                  disabled={copyingInviteId !== null}
                  className={`${LINK_BUTTON} text-amber-400 hover:text-amber-300 focus-visible:outline-amber-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copyingInviteId === i.id ? "Copying…" : "Copy link"}
                </button>
                <button
                  onClick={() => cancelInvite(i.id)}
                  className={`${LINK_BUTTON} text-slate-500 hover:text-rose-400 focus-visible:outline-rose-400`}
                >
                  Cancel invite
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <form onSubmit={invite} className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            required
            type="email"
            aria-label="Email to invite"
            placeholder="Email to invite *"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            className="flex-1 min-w-50"
          />
          <Select
            aria-label="Portal role"
            value={inviteForm.role}
            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as PortalRole })}
            className="max-w-32"
          >
            <option value="Viewer">Viewer</option>
            <option value="Manager">Manager</option>
            <option value="Owner">Owner</option>
          </Select>
          <Button type="submit" loading={inviting}>
            Grant access (invite)
          </Button>
          {lastInviteUrl && (
            <div className="w-full text-xs text-slate-500">
              <p>
                Email isn&apos;t configured yet, so share this invite link manually. It expires in 7
                days.
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="break-all text-amber-400">{lastInviteUrl}</span>
                <Button type="button" variant="secondary" onClick={copyInviteLink}>
                  Copy link
                </Button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
