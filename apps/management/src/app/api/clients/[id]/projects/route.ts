import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PROJECT_STATUSES } from "@/types";

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/clients/[id]/projects — any logged-in staff user.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const projects = await prisma.project.findMany({
    where: { clientId: parseInt(id) },
    include: { milestones: { select: { id: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

// POST /api/clients/[id]/projects — admin only: create a project for this client.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const clientId = parseInt(id);
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const { name, status, stagingUrl, liveUrl } = await req.json();
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (status && !(PROJECT_STATUSES as string[]).includes(status)) {
      return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
    }
    for (const url of [stagingUrl, liveUrl]) {
      if (typeof url === "string" && url !== "" && !isHttpUrl(url)) {
        return NextResponse.json({ error: "URLs must start with http:// or https://" }, { status: 400 });
      }
    }

    const project = await prisma.project.create({
      data: {
        clientId,
        name: name.trim().slice(0, 300),
        status: status || "Discovery",
        stagingUrl: typeof stagingUrl === "string" ? stagingUrl : "",
        liveUrl: typeof liveUrl === "string" ? liveUrl : "",
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clients/[id]/projects]", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
