import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";
import { logAudit } from "@/lib/auditLog";

interface Params {
  params: Promise<{ id: string; mid: string }>;
}

// POST /api/portal/projects/[id]/milestones/[mid]/approve — Manager+.
// Body: { decision: "Approved" | "ChangesRequested", comment? }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't approve milestones" }, { status: 403 });
    }

    const { id, mid } = await params;
    const { decision, comment } = await req.json();
    if (!["Approved", "ChangesRequested"].includes(decision)) {
      return NextResponse.json({ error: "decision must be Approved or ChangesRequested" }, { status: 400 });
    }

    const milestone = await prisma.milestone.findFirst({
      where: { id: parseInt(mid), projectId: parseInt(id), project: { clientId: sessionUser.clientId } },
    });
    if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });

    const updated = await prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        approvalStatus: decision,
        approvalComment: comment || "",
        approvedByPortalUserId: sessionUser.id,
        approvedAt: new Date(),
      },
    });

    await logAudit({
      actorType: "Portal",
      actorId: sessionUser.id,
      actorLabel: sessionUser.email,
      action: decision === "Approved" ? "approve_milestone" : "request_milestone_changes",
      targetType: "Milestone",
      targetId: milestone.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /api/portal/projects/[id]/milestones/[mid]/approve]", error);
    return NextResponse.json({ error: "Failed to record decision" }, { status: 500 });
  }
}
