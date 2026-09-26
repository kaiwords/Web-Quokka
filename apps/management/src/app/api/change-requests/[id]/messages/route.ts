import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/change-requests/[id]/messages — admin only: staff reply on a change request thread.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const changeRequestId = parseInt(id);
    const changeRequest = await prisma.changeRequest.findUnique({ where: { id: changeRequestId } });
    if (!changeRequest) return NextResponse.json({ error: "Change request not found" }, { status: 404 });

    const { body } = await req.json();
    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { threadType: "ChangeRequest", threadId: changeRequestId, authorType: "Staff", authorName: sessionUser.username, body: body.trim().slice(0, 10000) },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[POST /api/change-requests/[id]/messages]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
