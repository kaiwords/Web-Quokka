import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseId } from "@/lib/validate";
import { logAudit } from "@/lib/auditLog";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/clients/[id]/approve — admin only. Marks a self-registered
// business as vetted.
//
// Approval is a review stamp, not an access switch: a self-signed-up portal
// user can already sign in and see their OWN empty business. What approval
// gates is staff treating the record as a real client — attaching projects,
// invoices and services to it. Kept as an explicit step so a stranger's
// sign-up never silently becomes a client in the pipeline.
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    if (client.approvedAt) {
      return NextResponse.json({ error: "This client is already approved." }, { status: 409 });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: { approvedAt: new Date(), approvedBy: sessionUser.username },
    });

    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: "approve-client",
      targetType: "Client",
      targetId: id,
    });

    return NextResponse.json({
      success: true,
      approvedAt: updated.approvedAt,
      approvedBy: updated.approvedBy,
    });
  } catch (error) {
    console.error("[POST /api/clients/[id]/approve]", error);
    return NextResponse.json({ error: "Failed to approve client" }, { status: 500 });
  }
}
