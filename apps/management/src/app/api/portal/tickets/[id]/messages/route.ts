import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";
import { notify, notifyMany, adminUserIds } from "@/lib/notify";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/portal/tickets/[id]/messages — Manager+: reply on the ticket thread.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't reply" }, { status: 403 });
    }

    const { id } = await params;
    const ticketId = parseInt(id);
    const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, source: "Client", clientId: sessionUser.clientId } });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const { body } = await req.json();
    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { threadType: "Ticket", threadId: ticketId, authorType: "Portal", authorName: sessionUser.name, body: body.trim().slice(0, 10000) },
    });

    // The client replying puts the ball back in staff's court.
    if (ticket.status === "WaitingOnClient") {
      await prisma.ticket.update({ where: { id: ticketId }, data: { status: "InProgress" } });
    }

    // Tell whoever owns the ticket. No actorUserId here — the author is a
    // portal user, a different trust boundary entirely, so they can never
    // be the staff recipient. An unowned ticket falls back to the admins so
    // a client reply can't land with nobody watching.
    const preview = body.trim().slice(0, 140);
    if (ticket.assignedToUserId) {
      await notify({
        userId: ticket.assignedToUserId,
        type: "TicketReply",
        title: `New reply on: ${ticket.title}`,
        body: `${sessionUser.name} replied — "${preview}"`,
        link: `/client-tickets/${ticketId}`,
      });
    } else {
      await notifyMany(await adminUserIds(), {
        type: "TicketReply",
        title: `New reply on unassigned ticket: ${ticket.title}`,
        body: `${sessionUser.name} replied — "${preview}"`,
        link: `/client-tickets/${ticketId}`,
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[POST /api/portal/tickets/[id]/messages]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
