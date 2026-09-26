import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseId } from "@/lib/validate";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/requests/[id] — admin only: update status (or edit fields).
// Status is admin-managed, same as a Ticket — a user raises it, an admin
// works it. Scoped to staff-raised requests only; portal tickets have their
// own route (/api/client-tickets) with different status semantics.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const requestId = parseId(id);
    if (requestId === null) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const existing = await prisma.ticket.findUnique({ where: { id: requestId } });
    if (!existing || existing.source !== "User") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Whitelist fields — spreading the raw body allows nested relation
    // writes and flipping `source`, which would surface an internal request
    // in a client's portal.
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 500);
    if (typeof body.description === "string") data.description = body.description.slice(0, 5000);
    if (typeof body.status === "string") {
      if (!(TICKET_STATUSES as string[]).includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (typeof body.priority === "string") {
      if (!(TICKET_PRIORITIES as string[]).includes(body.priority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
      }
      data.priority = body.priority;
    }
    if ("clientId" in body) {
      data.clientId = body.clientId ? parseId(String(body.clientId)) : null;
      if (body.clientId && data.clientId === null) {
        return NextResponse.json({ error: "Invalid client id" }, { status: 400 });
      }
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const request = await prisma.ticket.update({
      where: { id: requestId },
      data,
      include: { client: { select: { id: true, name: true } } },
    });

    return NextResponse.json(request);
  } catch (error) {
    console.error("[PATCH /api/requests/[id]]", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

// DELETE /api/requests/[id] — an admin, or the user who raised it, may
// withdraw/delete it. Staff-raised requests only — portal tickets can't be
// deleted here (createdBy holds a portal user's self-chosen display name,
// which can collide with a staff username).
export async function DELETE(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = parseId(id);
  if (requestId === null) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }
  const request = await prisma.ticket.findUnique({ where: { id: requestId } });
  if (!request || request.source !== "User") {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (!sessionUser.isAdmin && request.createdBy !== sessionUser.username) {
    return NextResponse.json({ error: "You can only withdraw your own requests" }, { status: 403 });
  }

  await prisma.ticket.delete({ where: { id: request.id } });
  return NextResponse.json({ success: true });
}
