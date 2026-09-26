import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/portal/change-requests/[id]/messages — Manager+: ask a question
// on a change request thread (e.g. instead of approving/declining a quote outright).
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't send messages" }, { status: 403 });
    }

    const { id } = await params;
    const changeRequestId = parseInt(id);
    const changeRequest = await prisma.changeRequest.findFirst({ where: { id: changeRequestId, clientId: sessionUser.clientId } });
    if (!changeRequest) return NextResponse.json({ error: "Change request not found" }, { status: 404 });

    const { body } = await req.json();
    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { threadType: "ChangeRequest", threadId: changeRequestId, authorType: "Portal", authorName: sessionUser.name, body: body.trim().slice(0, 10000) },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[POST /api/portal/change-requests/[id]/messages]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
