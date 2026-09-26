import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/milestones/[id]/tasks — admin only: add a deliverable to a milestone.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const milestoneId = parseInt(id);
    if (Number.isNaN(milestoneId)) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });

    const { title } = await req.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const count = await prisma.projectTask.count({ where: { milestoneId } });
    const task = await prisma.projectTask.create({ data: { milestoneId, title: title.trim().slice(0, 300), order: count } });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[POST /api/milestones/[id]/tasks]", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
