import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET /api/requests — asks raised by users (source: "User"). Any logged-in
// user can view. Optional ?clientId= narrows to one client.
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const requests = await prisma.ticket.findMany({
    where: { source: "User", ...(clientId ? { clientId: parseInt(clientId) } : {}) },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

// POST /api/requests — any logged-in user can raise a request.
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { title, description, priority, clientId } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const request = await prisma.ticket.create({
      data: {
        source: "User",
        title,
        description: description || "",
        priority: priority || "Medium",
        status: "New",
        clientId: clientId ? parseInt(clientId) : null,
        createdBy: sessionUser.username,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("[POST /api/requests]", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
