import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseId } from "@/lib/validate";

const MOSCOW = ["Must", "Should", "Could", "Wont"];

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/clients/[id]/requirements — add a requirement to a client
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { id } = await params;
    const clientId = parseId(id);
    if (clientId === null) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const body = await req.json();
    const { role, functionality, value, priority } = body;

    if (typeof functionality !== "string" || !functionality.trim()) {
      return NextResponse.json({ error: "Functionality is required" }, { status: 400 });
    }
    if (priority && !MOSCOW.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    const requirement = await prisma.requirement.create({
      data: {
        clientId,
        role: typeof role === "string" ? role.slice(0, 300) : "",
        functionality: functionality.trim().slice(0, 2000),
        value: typeof value === "string" ? value.slice(0, 2000) : "",
        priority: priority || "Must",
      },
    });

    return NextResponse.json(requirement, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clients/[id]/requirements]", error);
    return NextResponse.json({ error: "Failed to create requirement" }, { status: 500 });
  }
}
