import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";
import { notifyMany, adminUserIds } from "@/lib/notify";

// GET /api/portal/messages — any portal user: their business's direct
// conversation with the team (threadType "Client", threadId = clientId).
export async function GET() {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const messages = await prisma.message.findMany({
      where: { threadType: "Client", threadId: sessionUser.clientId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error("[GET /api/portal/messages]", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

// POST /api/portal/messages — Manager+: send a message to the team.
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't send messages" }, { status: 403 });
    }

    const { body } = await req.json();
    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { threadType: "Client", threadId: sessionUser.clientId, authorType: "Portal", authorName: sessionUser.name, body: body.trim().slice(0, 10000) },
    });

    // The direct thread has no assignee, so this always goes to the admins —
    // a client message must never land with nobody watching.
    const client = await prisma.client.findUnique({
      where: { id: sessionUser.clientId },
      select: { name: true, company: true },
    });
    const preview = body.trim().slice(0, 140);
    await notifyMany(await adminUserIds(), {
      type: "ClientMessage",
      title: `New message from ${client?.company || client?.name || "a client"}`,
      body: `${sessionUser.name} wrote — "${preview}"`,
      link: `/clients/${sessionUser.clientId}#messages`,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[POST /api/portal/messages]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
