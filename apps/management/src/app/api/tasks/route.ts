import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { OPEN_TASK_STATUSES, TASK_STATUSES, type TaskStatus } from "@/types";
import type { Prisma } from "@prisma/client";
import { notify } from "@/lib/notify";

// GET /api/tasks — task follow-up list across all clients.
// Query params: ?clientId=  ?status=Todo|InProgress|Done|Cancelled
// ?open=true|false — true keeps only Todo/InProgress, false only the closed
// ones (Done/Cancelled); omit for everything.
// ?stage=<ClientStage> — tasks belonging to clients currently at that stage
// (used by the dashboard's Pipeline-by-stage drilldown).
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const open = searchParams.get("open");
    const stage = searchParams.get("stage");

    if (status && !(TASK_STATUSES as string[]).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const where: Prisma.TaskWhereInput = {};
    if (clientId) where.clientId = parseInt(clientId);
    // An explicit ?status= is the narrower filter, so it wins over ?open=.
    if (status) {
      where.status = status;
    } else if (open !== null) {
      where.status = open === "true"
        ? { in: OPEN_TASK_STATUSES }
        : { notIn: OPEN_TASK_STATUSES };
    }
    if (stage) where.client = { stage };

    const tasks = await prisma.task.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    // SQLite would sort the status column alphabetically, which is not the
    // lifecycle order — rank it here so open work floats to the top.
    const rank = (s: string) => {
      const i = TASK_STATUSES.indexOf(s as TaskStatus);
      return i === -1 ? TASK_STATUSES.length : i;
    };
    tasks.sort((a, b) => rank(a.status) - rank(b.status));

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[GET /api/tasks]", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks — create a follow-up task for a client. Any logged-in user
// can add a follow-up, but only an admin may assign it — a non-admin's task
// is always created "Unassigned". New tasks always start at "Todo"; there is
// no approval step before the work can begin.
//
// Assignment is by `assigneeUserId` (a real account), not a typed-in name,
// so the assignee can actually be notified.
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { clientId, title, assigneeUserId } = await req.json();

    if (!clientId || !title) {
      return NextResponse.json({ error: "clientId and title are required" }, { status: 400 });
    }

    let assignedUser: { id: number; username: string } | null = null;
    if (sessionUser.isAdmin && Number.isInteger(assigneeUserId)) {
      assignedUser = await prisma.user.findUnique({
        where: { id: assigneeUserId },
        select: { id: true, username: true },
      });
      if (!assignedUser) {
        return NextResponse.json({ error: "No such user" }, { status: 400 });
      }
    }

    const task = await prisma.task.create({
      data: {
        clientId: parseInt(clientId),
        title,
        assignee: assignedUser ? assignedUser.username : "Unassigned",
        assigneeUserId: assignedUser?.id ?? null,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    if (assignedUser) {
      await notify({
        userId: assignedUser.id,
        actorUserId: sessionUser.id,
        type: "TaskAssigned",
        title: `You were assigned: ${task.title}`,
        body: `${sessionUser.username} assigned you this follow-up for ${task.client.name}.`,
        link: `/tasks`,
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks]", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
