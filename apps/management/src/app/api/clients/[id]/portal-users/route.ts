import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createPortalInvite } from "@/lib/portalTeam";
import { logAudit } from "@/lib/auditLog";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/clients/[id]/portal-users — any logged-in staff user: this
// client's portal members + pending invites (mirrors GET /api/portal/team).
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id);

  const [members, invites] = await Promise.all([
    prisma.portalUser.findMany({
      where: { clientId },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // No `token` here: an invite token lets whoever holds it claim that
    // invite (possibly as an Owner), so it's only ever returned once, to the
    // admin who creates the invite (POST below) — never in a listing.
    prisma.portalInvite.findMany({
      where: { clientId, acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ members, invites });
}

// POST /api/clients/[id]/portal-users — admin only: invite a business
// contact onto the client portal. Body: { email, role }. Returns the
// invite link directly (email sending is stubbed to a server log this
// phase — see src/lib/mailer.ts) so staff can copy/send it manually.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const clientId = parseInt(id);
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const { email, role } = await req.json();
    if (typeof email !== "string" || typeof role !== "string") {
      return NextResponse.json({ error: "A valid email and role are required" }, { status: 400 });
    }

    const result = await createPortalInvite({
      clientId,
      email,
      role,
      invitedBy: sessionUser.username,
      intro: `Web Quokka invited you to their client portal for ${client.company || client.name}`,
      requestOrigin: new URL(req.url).origin,
      staffContext: true,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: "invite-portal-user",
      targetType: "PortalInvite",
      targetId: result.invite.id as number,
    });

    return NextResponse.json({ ...result.invite, inviteUrl: result.inviteUrl }, { status: result.status });
  } catch (error) {
    console.error("[POST /api/clients/[id]/portal-users]", error);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
