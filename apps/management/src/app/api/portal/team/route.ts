import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";
import { createPortalInvite } from "@/lib/portalTeam";
import { logAudit } from "@/lib/auditLog";

// GET /api/portal/team — any portal role: list this business's members + pending invites.
export async function GET() {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const [members, invites] = await Promise.all([
    prisma.portalUser.findMany({
      where: { clientId: sessionUser.clientId },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // No `token`: any role (including Viewer) can list the team, and a token
    // lets its holder claim the invite — possibly as an Owner. It's only
    // returned once, to the Owner who creates the invite (POST below).
    prisma.portalInvite.findMany({
      where: { clientId: sessionUser.clientId, acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ members, invites });
}

// POST /api/portal/team — Owner only: invite a new team member.
// Body: { email, role }
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Owner")) {
      return NextResponse.json({ error: "Only an Owner can invite team members" }, { status: 403 });
    }

    const { email, role } = await req.json();
    if (typeof email !== "string" || typeof role !== "string") {
      return NextResponse.json({ error: "A valid email and role are required" }, { status: 400 });
    }

    const result = await createPortalInvite({
      clientId: sessionUser.clientId,
      email,
      role,
      invitedBy: sessionUser.name,
      intro: `${sessionUser.name} invited you to join their Web Quokka client portal`,
      requestOrigin: new URL(req.url).origin,
      staffContext: false,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await logAudit({
      actorType: "Portal",
      actorId: sessionUser.id,
      actorLabel: sessionUser.email,
      action: "invite-team-member",
      targetType: "PortalInvite",
      targetId: result.invite.id as number,
    });

    return NextResponse.json({ ...result.invite, inviteUrl: result.inviteUrl }, { status: result.status });
  } catch (error) {
    console.error("[POST /api/portal/team]", error);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
