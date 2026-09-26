import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/suggestions/[id]/messages — admin only: staff reply on a suggestion thread.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const suggestionId = parseInt(id);
    const suggestion = await prisma.suggestion.findUnique({ where: { id: suggestionId } });
    if (!suggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });

    const { body } = await req.json();
    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { threadType: "Suggestion", threadId: suggestionId, authorType: "Staff", authorName: sessionUser.username, body: body.trim().slice(0, 10000) },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[POST /api/suggestions/[id]/messages]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
