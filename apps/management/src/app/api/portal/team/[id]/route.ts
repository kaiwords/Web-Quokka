import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";
import { isLastActiveOwner } from "@/lib/portalTeam";
import { logAudit } from "@/lib/auditLog";

interface Params {
  params: Promise<{ id: string }>;
}

// DELETE /api/portal/team/[id]?type=member|invite — Owner only: remove a
// team member or cancel a pending invite. `type` is required because member
// and invite ids come from separate tables and can collide numerically —
// without it, an invite id that happens to match an unrelated member id
// would delete the wrong record. Refuses to remove yourself or the last
// remaining Owner, mirroring /api/users/[id].
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Owner")) {
      return NextResponse.json({ error: "Only an Owner can remove team members" }, { status: 403 });
    }

    const { id } = await params;
    const targetId = parseInt(id);
    const type = new URL(req.url).searchParams.get("type");
    if (type !== "member" && type !== "invite") {
      return NextResponse.json({ error: "type=member or type=invite is required" }, { status: 400 });
    }

    if (type === "invite") {
      const invite = await prisma.portalInvite.findFirst({ where: { id: targetId, clientId: sessionUser.clientId } });
      if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
      await prisma.portalInvite.delete({ where: { id: invite.id } });
      await logAudit({
        actorType: "Portal",
        actorId: sessionUser.id,
        actorLabel: sessionUser.email,
        action: "cancel-invite",
        targetType: "PortalInvite",
        targetId: invite.id,
      });
      return NextResponse.json({ success: true });
    }

    const member = await prisma.portalUser.findFirst({ where: { id: targetId, clientId: sessionUser.clientId } });
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (member.id === sessionUser.id) {
      return NextResponse.json({ error: "You can't remove your own account" }, { status: 400 });
    }
    if (await isLastActiveOwner(member)) {
      return NextResponse.json({ error: "Can't remove the last Owner" }, { status: 400 });
    }
    await prisma.portalUser.delete({ where: { id: member.id } });
    // The staff-side removal route already logs this — an Owner doing it
    // must leave the same trail.
    await logAudit({
      actorType: "Portal",
      actorId: sessionUser.id,
      actorLabel: sessionUser.email,
      action: "remove-team-member",
      targetType: "PortalUser",
      targetId: member.id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/portal/team/[id]]", error);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
