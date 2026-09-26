import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseDate, parseId } from "@/lib/validate";

const MILESTONE_STATUSES = ["Upcoming", "InProgress", "Completed"];

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/milestones/[id] — admin only: edit title/status/dueDate/order.
// Setting status to "Completed" resets any prior client approval decision,
// since a re-delivered milestone needs a fresh look.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const milestoneId = parseId(id);
    if (milestoneId === null) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    const current = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!current) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });

    const { title, status, dueDate, order } = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof title === "string" && title.trim()) data.title = title.trim().slice(0, 300);
    if (typeof order === "number" && Number.isInteger(order)) data.order = order;
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === "") {
        data.dueDate = null;
      } else {
        const due = parseDate(dueDate);
        if (!due) return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
        data.dueDate = due;
      }
    }
    if (typeof status === "string") {
      if (!MILESTONE_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid milestone status" }, { status: 400 });
      }
      data.status = status;
      if (status === "Completed" && current.status !== "Completed") {
        data.approvalStatus = "Pending";
        data.approvalComment = "";
        data.approvedByPortalUserId = null;
        data.approvedAt = null;
      }
    }

    const milestone = await prisma.milestone.update({ where: { id: milestoneId }, data, include: { tasks: true } });
    return NextResponse.json(milestone);
  } catch (error) {
    console.error("[PATCH /api/milestones/[id]]", error);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

// DELETE /api/milestones/[id] — admin only.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id } = await params;
    const milestoneId = parseId(id);
    if (milestoneId === null) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    const existing = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!existing) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    await prisma.milestone.delete({ where: { id: milestoneId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/milestones/[id]]", error);
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}
