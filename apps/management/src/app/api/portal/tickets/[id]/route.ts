import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";

interface Params {
  params: Promise<{ id: string }>;
}

const REOPEN_WINDOW_MS = 1000 * 60 * 60 * 24 * 7; // 7 days, per spec

// GET /api/portal/tickets/[id] — ticket detail + its message thread + attachments.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const ticketId = parseInt(id);
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, source: "Client", clientId: sessionUser.clientId },
    include: { documents: true },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { threadType: "Ticket", threadId: ticketId },
    orderBy: { createdAt: "asc" },
  });

  // Computed server-side (not in the client component) so the UI never
  // calls Date.now() during render just to decide whether to show "Reopen".
  const canReopen = ticket.status === "Resolved" && !!ticket.resolvedAt && Date.now() - ticket.resolvedAt.getTime() < REOPEN_WINDOW_MS;

  return NextResponse.json({ ...ticket, messages, canReopen });
}

// PATCH /api/portal/tickets/[id] — Manager+: mark resolved, or reopen
// within 7 days of resolution, or submit a satisfaction rating.
// Body: { action: "resolve" | "reopen" } or { rating: 1-5 }
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't update tickets" }, { status: 403 });
    }

    const { id } = await params;
    const ticketId = parseInt(id);
    const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, source: "Client", clientId: sessionUser.clientId } });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const { action, rating } = await req.json();

    if (action === "resolve") {
      if (ticket.status === "Closed") {
        return NextResponse.json({ error: "A closed ticket can't be resolved" }, { status: 400 });
      }
      // Idempotent: re-resolving must not bump resolvedAt (which would
      // extend the 7-day reopen window) or duplicate the system message.
      if (ticket.status === "Resolved") {
        return NextResponse.json(ticket);
      }
      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "Resolved", resolvedAt: new Date() },
      });
      await prisma.message.create({
        data: { threadType: "Ticket", threadId: ticketId, authorType: "System", authorName: "System", body: `Marked resolved by ${sessionUser.name}.` },
      });
      return NextResponse.json(updated);
    }

    if (action === "reopen") {
      if (ticket.status !== "Resolved" || !ticket.resolvedAt) {
        return NextResponse.json({ error: "Only a resolved ticket can be reopened" }, { status: 400 });
      }
      if (Date.now() - ticket.resolvedAt.getTime() > REOPEN_WINDOW_MS) {
        return NextResponse.json({ error: "This ticket can no longer be reopened (past the 7-day window)" }, { status: 400 });
      }
      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "Open", resolvedAt: null },
      });
      await prisma.message.create({
        data: { threadType: "Ticket", threadId: ticketId, authorType: "System", authorName: "System", body: `Reopened by ${sessionUser.name}.` },
      });
      return NextResponse.json(updated);
    }

    if (typeof rating === "number") {
      if (!["Resolved", "Closed"].includes(ticket.status)) {
        return NextResponse.json({ error: "Only a resolved ticket can be rated" }, { status: 400 });
      }
      // Whole stars only — 3.5 used to reach the DB and 500.
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Rating must be a whole number from 1 to 5" }, { status: 400 });
      }
      if (ticket.satisfactionRating !== null) {
        return NextResponse.json({ error: "This ticket has already been rated — thanks!" }, { status: 409 });
      }
      const updated = await prisma.ticket.update({ where: { id: ticketId }, data: { satisfactionRating: rating } });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Unrecognized update" }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /api/portal/tickets/[id]]", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
