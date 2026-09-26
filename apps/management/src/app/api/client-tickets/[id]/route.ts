import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { parseId } from "@/lib/validate";
import { PORTAL_TICKET_STATUSES, PORTAL_TICKET_STATUS_LABELS, TICKET_PRIORITIES } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/client-tickets/[id] — admin only: detail + message thread + attachments.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { id } = await params;
  const ticketId = parseId(id);
  if (ticketId === null) return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, source: "Client" },
    include: { client: { select: { id: true, name: true, company: true } }, documents: true },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const messages = await prisma.message.findMany({ where: { threadType: "Ticket", threadId: ticketId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ ...ticket, messages });
}

// PATCH /api/client-tickets/[id] — admin only: change status/priority, or
// hand the ticket to a staff account via `assignedToUserId` (null to
// unassign). Like tasks, assignment is by account rather than typed-in name
// so the person picked up can actually be notified.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const ticketId = parseId(id);
    if (ticketId === null) return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });

    // Scope to portal tickets — staff requests have different statuses and
    // their own route (/api/requests).
    const existing = await prisma.ticket.findFirst({ where: { id: ticketId, source: "Client" } });
    if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const body = await req.json();
    const { status, priority } = body;

    const data: Record<string, unknown> = {};
    if (typeof status === "string") {
      if (!(PORTAL_TICKET_STATUSES as string[]).includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = status;
      // Don't reset resolvedAt when a ticket is already Resolved (that
      // would silently extend the client's 7-day reopen window).
      if (status === "Resolved" && existing.status !== "Resolved") data.resolvedAt = new Date();
      else if (status !== "Resolved" && status !== "Closed") data.resolvedAt = null;
    }
    if (typeof priority === "string") {
      if (!(TICKET_PRIORITIES as string[]).includes(priority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
      }
      data.priority = priority;
    }
    let assignedUser: { id: number; username: string } | null = null;
    if ("assignedToUserId" in body) {
      if (body.assignedToUserId === null) {
        data.assignedToUserId = null;
        data.assignedTo = "Unassigned";
      } else if (Number.isInteger(body.assignedToUserId)) {
        assignedUser = await prisma.user.findUnique({
          where: { id: body.assignedToUserId },
          select: { id: true, username: true },
        });
        if (!assignedUser) return NextResponse.json({ error: "No such user" }, { status: 400 });
        data.assignedToUserId = assignedUser.id;
        data.assignedTo = assignedUser.username;
      } else {
        return NextResponse.json({ error: "Invalid assignedToUserId" }, { status: 400 });
      }
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json(existing);
    }

    const ticket = await prisma.ticket.update({ where: { id: ticketId }, data });

    // Only on an actual change of hands — a status edit must not re-notify.
    if (assignedUser && assignedUser.id !== existing.assignedToUserId) {
      await notify({
        userId: assignedUser.id,
        actorUserId: sessionUser.id,
        type: "TicketAssigned",
        title: `Ticket assigned to you: ${ticket.title}`,
        body: `${sessionUser.username} put you on this portal ticket.`,
        link: `/client-tickets/${ticketId}`,
      });
    }

    if (typeof status === "string" && status !== existing.status) {
      // Client-visible thread note: display label, no staff username.
      const label = PORTAL_TICKET_STATUS_LABELS[status as keyof typeof PORTAL_TICKET_STATUS_LABELS] ?? status;
      await prisma.message.create({
        data: { threadType: "Ticket", threadId: ticketId, authorType: "System", authorName: "System", body: `Status changed to "${label}".` },
      });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[PATCH /api/client-tickets/[id]]", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
