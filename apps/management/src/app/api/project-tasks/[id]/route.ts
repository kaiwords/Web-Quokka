import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/project-tasks/[id] — admin only: toggle a deliverable done/not done.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id } = await params;
    const taskId = parseInt(id);
    if (Number.isNaN(taskId)) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const existing = await prisma.projectTask.findUnique({ where: { id: taskId } });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const { done } = await req.json();
    const task = await prisma.projectTask.update({ where: { id: taskId }, data: { done: Boolean(done) } });
    return NextResponse.json(task);
  } catch (error) {
    console.error("[PATCH /api/project-tasks/[id]]", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/project-tasks/[id] — admin only.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id } = await params;
    const taskId = parseInt(id);
    if (Number.isNaN(taskId)) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const existing = await prisma.projectTask.findUnique({ where: { id: taskId } });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    await prisma.projectTask.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/project-tasks/[id]]", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
