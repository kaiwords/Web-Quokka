import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isLastActiveOwner } from "@/lib/portalTeam";
import { logAudit } from "@/lib/auditLog";

interface Params {
  params: Promise<{ id: string; userId: string }>;
}

// PATCH /api/clients/[id]/portal-users/[userId] — admin only: revoke or
// restore a business user's portal access without deleting their account.
// Body: { status: "Disabled" | "Active" }. Revoking also deletes their
// sessions so they're signed out immediately; getPortalUserByToken and the
// login route both refuse Disabled users, so they can't get back in.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id, userId } = await params;
    const member = await prisma.portalUser.findFirst({ where: { id: parseInt(userId), clientId: parseInt(id) } });
    if (!member) return NextResponse.json({ error: "Portal user not found" }, { status: 404 });

    const { status } = await req.json();
    if (status !== "Disabled" && status !== "Active") {
      return NextResponse.json({ error: 'status must be "Disabled" or "Active"' }, { status: 400 });
    }

    if (status === "Disabled") {
      if (await isLastActiveOwner(member)) {
        return NextResponse.json(
          { error: "Can't revoke the business's last active Owner — invite another Owner first" },
          { status: 400 }
        );
      }
      await prisma.$transaction([
        prisma.portalUser.update({ where: { id: member.id }, data: { status: "Disabled" } }),
        prisma.portalSession.deleteMany({ where: { portalUserId: member.id } }),
      ]);
    } else {
      await prisma.portalUser.update({ where: { id: member.id }, data: { status: "Active" } });
    }

    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: status === "Disabled" ? "revoke_portal_access" : "restore_portal_access",
      targetType: "PortalUser",
      targetId: member.id,
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[PATCH /api/clients/[id]/portal-users/[userId]]", error);
    return NextResponse.json({ error: "Failed to update portal access" }, { status: 500 });
  }
}

// DELETE /api/clients/[id]/portal-users/[userId] — admin only: delete a
// business user's portal account entirely. Refuses to remove the business's
// last active Owner.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id, userId } = await params;
    const member = await prisma.portalUser.findFirst({ where: { id: parseInt(userId), clientId: parseInt(id) } });
    if (!member) return NextResponse.json({ error: "Portal user not found" }, { status: 404 });

    if (await isLastActiveOwner(member)) {
      return NextResponse.json(
        { error: "Can't remove the business's last active Owner — invite another Owner first" },
        { status: 400 }
      );
    }

    await prisma.portalUser.delete({ where: { id: member.id } });

    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: "delete_portal_user",
      targetType: "PortalUser",
      targetId: member.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/clients/[id]/portal-users/[userId]]", error);
    return NextResponse.json({ error: "Failed to remove portal user" }, { status: 500 });
  }
}
