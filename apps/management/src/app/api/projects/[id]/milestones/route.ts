import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/projects/[id]/milestones — admin only: add a milestone.
// Body: { title, dueDate?, tasks?: string[] } — tasks are the initial deliverables checklist.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { title, dueDate, tasks } = await req.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    let due: Date | null = null;
    if (dueDate) {
      due = new Date(dueDate);
      if (Number.isNaN(due.getTime())) {
        return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
      }
    }

    const count = await prisma.milestone.count({ where: { projectId } });
    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        title: title.trim().slice(0, 300),
        dueDate: due,
        order: count,
        tasks: {
          create: Array.isArray(tasks)
            ? tasks.filter((t: unknown) => typeof t === "string" && t.trim()).map((t: string, i: number) => ({ title: t.trim(), order: i }))
            : [],
        },
      },
      include: { tasks: true },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects/[id]/milestones]", error);
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}
