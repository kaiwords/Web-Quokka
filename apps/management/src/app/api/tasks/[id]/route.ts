import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseId, parseDate } from "@/lib/validate";
import { TASK_STATUSES } from "@/types";
import { notify } from "@/lib/notify";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/tasks/[id] — move the task along its status (Todo/InProgress/
// Done/Cancelled) or edit title/dueDate. Assigning work is admin-only;
// whoever the task landed on reports its status themselves, with nobody's
// approval needed.
//
// Assignment takes `assigneeUserId` (a real account, or null to unassign) —
// the free-text `assignee` is no longer accepted, since a name that isn't an
// account is a task nobody can be told about. The username is denormalized
// onto `assignee` here so lists don't have to join User.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseId(id);
    if (taskId === null) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }
    const body = await req.json();

    if ("assigneeUserId" in body && !sessionUser.isAdmin) {
      return NextResponse.json({ error: "Only admins can assign tasks" }, { status: 403 });
    }

    // Whitelist fields — spreading the raw body into prisma.update allows
    // nested relation writes reaching admin-only data through task.client
    // (portal users, invoices, ...). Same hole clients/[id] already closed.
    const data: Record<string, unknown> = {};
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 500);
    if (typeof body.status === "string") {
      if (!(TASK_STATUSES as string[]).includes(body.status)) {
        return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
      }
      data.status = body.status;
    }
    // Resolve the account up front: an id that matches no user is a bad
    // request, not a silently unassigned task.
    let assignedUser: { id: number; username: string } | null = null;
    if ("assigneeUserId" in body) {
      if (body.assigneeUserId === null) {
        data.assigneeUserId = null;
        data.assignee = "Unassigned";
      } else if (Number.isInteger(body.assigneeUserId)) {
        assignedUser = await prisma.user.findUnique({
          where: { id: body.assigneeUserId },
          select: { id: true, username: true },
        });
        if (!assignedUser) {
          return NextResponse.json({ error: "No such user" }, { status: 400 });
        }
        data.assigneeUserId = assignedUser.id;
        data.assignee = assignedUser.username;
      } else {
        return NextResponse.json({ error: "Invalid assigneeUserId" }, { status: 400 });
      }
    }
    if ("dueDate" in body) {
      if (body.dueDate === null || body.dueDate === "") {
        data.dueDate = null;
      } else {
        const due = parseDate(body.dueDate);
        if (!due) return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
        data.dueDate = due;
      }
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: { client: { select: { id: true, name: true } } },
    });

    // Tell the new assignee — but only on an actual change of hands, so
    // editing a title or ticking a status doesn't re-notify them.
    if (assignedUser && assignedUser.id !== existing.assigneeUserId) {
      await notify({
        userId: assignedUser.id,
        actorUserId: sessionUser.id,
        type: "TaskAssigned",
        title: `You were assigned: ${task.title}`,
        body: `${sessionUser.username} assigned you this follow-up for ${task.client.name}.`,
        link: `/tasks`,
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[PATCH /api/tasks/[id]]", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseId(id);
    if (taskId === null) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/[id]]", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
