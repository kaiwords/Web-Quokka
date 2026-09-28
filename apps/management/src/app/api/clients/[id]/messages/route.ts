import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseId } from "@/lib/validate";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/clients/[id]/messages — any staff: the direct conversation with
// this business (threadType "Client", threadId = clientId — one running
// thread per business, not a per-thread record).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { id } = await params;
    const clientId = parseId(id);
    if (clientId === null) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: { threadType: "Client", threadId: clientId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error("[GET /api/clients/[id]/messages]", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

// POST /api/clients/[id]/messages — admin only: message the client's portal
// members (same admin-only rule as replying on their tickets).
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const clientId = parseId(id);
    if (clientId === null) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const { body } = await req.json();
    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { threadType: "Client", threadId: clientId, authorType: "Staff", authorName: sessionUser.username, body: body.trim().slice(0, 10000) },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clients/[id]/messages]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
