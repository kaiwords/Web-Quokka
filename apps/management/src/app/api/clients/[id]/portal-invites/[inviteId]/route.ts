import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string; inviteId: string }>;
}

// DELETE /api/clients/[id]/portal-invites/[inviteId] — admin only: cancel a pending invite.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id, inviteId } = await params;
    const invite = await prisma.portalInvite.findFirst({ where: { id: parseInt(inviteId), clientId: parseInt(id) } });
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

    await prisma.portalInvite.delete({ where: { id: invite.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/clients/[id]/portal-invites/[inviteId]]", error);
    return NextResponse.json({ error: "Failed to cancel invite" }, { status: 500 });
  }
}
