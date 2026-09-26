import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/client-tickets/[id]/messages — admin only: reply on a portal ticket thread.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const ticketId = parseInt(id);
    const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, source: "Client" } });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const { body } = await req.json();
    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { threadType: "Ticket", threadId: ticketId, authorType: "Staff", authorName: sessionUser.username, body: body.trim().slice(0, 10000) },
    });

    // A staff reply implicitly means the ball is back in the client's court.
    if (ticket.status === "Open" || ticket.status === "InProgress") {
      await prisma.ticket.update({ where: { id: ticketId }, data: { status: "WaitingOnClient" } });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[POST /api/client-tickets/[id]/messages]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
