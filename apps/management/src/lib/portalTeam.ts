import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mailer";
import { escapeHtml, normalizeEmail } from "@/lib/validate";

interface TeamMember {
  id: number;
  clientId: number;
  role: string;
  status: string;
}

export const PORTAL_ROLES = ["Owner", "Manager", "Viewer"] as const;

interface CreateInviteInput {
  clientId: number;
  email: string;
  role: string;
  /** Display name/username interpolated into the email — escaped here. */
  invitedBy: string;
  /** e.g. "WebQuokka invited you ... for Acme" vs "{owner} invited you ..." */
  intro: string;
  /** Origin used when NEXT_PUBLIC_APP_URL isn't set (from the request URL). */
  requestOrigin: string;
  /** true when a same-business Disabled member should get the staff-only
   *  "use Restore access" hint instead of a generic message. */
  staffContext: boolean;
}

type CreateInviteResult =
  | { ok: true; status: number; invite: Record<string, unknown>; inviteUrl: string }
  | { ok: false; status: number; error: string };

// One shared invite path for the staff route (clients/[id]/portal-users) and
// the business's own Team page — email normalisation, duplicate handling,
// HTML escaping and the cross-business wording live here so they can't drift.
export async function createPortalInvite(input: CreateInviteInput): Promise<CreateInviteResult> {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, status: 400, error: "A valid email is required" };
  if (!(PORTAL_ROLES as readonly string[]).includes(input.role)) {
    return { ok: false, status: 400, error: "A valid role is required" };
  }

  // Match either stored casing (legacy rows may predate normalisation).
  const existingMember = await prisma.portalUser.findFirst({
    where: { email: { in: [email, input.email.trim()] } },
  });
  if (existingMember) {
    if (existingMember.clientId !== input.clientId) {
      // Don't reveal that the email belongs to a *different* business.
      return { ok: false, status: 409, error: "That email is already in use." };
    }
    if (existingMember.status === "Disabled" && input.staffContext) {
      return {
        ok: false,
        status: 409,
        error: "That person's access was revoked — use Restore access instead of re-inviting",
      };
    }
    return { ok: false, status: 409, error: "That email is already a team member" };
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || input.requestOrigin;

  // A pending invite already exists: return it (with its link rebuilt) so a
  // double-click or a lost link doesn't mint duplicate invites.
  const pending = await prisma.portalInvite.findFirst({
    where: { clientId: input.clientId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (pending) {
    return {
      ok: true,
      status: 200,
      invite: { ...pending, token: undefined },
      inviteUrl: `${base}/portal/accept-invite?token=${pending.token}`,
    };
  }

  const token = generateToken();
  const invite = await prisma.portalInvite.create({
    data: {
      clientId: input.clientId,
      email,
      role: input.role,
      token,
      invitedBy: input.invitedBy,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  const inviteUrl = `${base}/portal/accept-invite?token=${token}`;
  await sendMail({
    to: email,
    subject: "You've been invited to the WebQuokka client portal",
    html: `<p>${escapeHtml(input.intro)} as a ${escapeHtml(input.role)}.</p><p><a href="${inviteUrl}">${inviteUrl}</a></p>`,
  });

  return { ok: true, status: 201, invite: { ...invite, token: undefined }, inviteUrl };
}

// A business must always keep at least one Owner who can still sign in,
// otherwise nobody on their side can manage their portal team. A revoked
// (Disabled) Owner doesn't count — they can't sign in. Shared by every path
// that removes, revokes, or otherwise takes an Owner out of action (staff
// admin routes and the business's own Team page) so the rule can't drift.
export async function isLastActiveOwner(member: TeamMember): Promise<boolean> {
  if (member.role !== "Owner" || member.status === "Disabled") return false;
  const otherActiveOwners = await prisma.portalUser.count({
    where: { clientId: member.clientId, role: "Owner", status: { not: "Disabled" }, id: { not: member.id } },
  });
  return otherActiveOwners === 0;
}
