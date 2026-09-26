import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseId } from "@/lib/validate";
import { PROJECT_STATUSES } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

// Only http(s) links — these are rendered as clickable links in the client
// portal, so javascript:/data: schemes must never be stored.
function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// GET /api/projects/[id] — any logged-in staff user: full project detail.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id: parseInt(id) },
    include: {
      client: { select: { id: true, name: true, company: true } },
      milestones: { orderBy: { order: "asc" }, include: { tasks: { orderBy: { order: "asc" } } } },
      updates: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(project);
}

// PATCH /api/projects/[id] — admin only: edit project fields.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const projectId = parseId(id);
    if (projectId === null) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { name, status, stagingUrl, liveUrl } = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim().slice(0, 300);
    if (typeof status === "string") {
      if (!(PROJECT_STATUSES as string[]).includes(status)) {
        return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
      }
      data.status = status;
    }
    if (typeof stagingUrl === "string") {
      if (stagingUrl !== "" && !isHttpUrl(stagingUrl)) {
        return NextResponse.json({ error: "Staging URL must start with http:// or https://" }, { status: 400 });
      }
      data.stagingUrl = stagingUrl;
    }
    if (typeof liveUrl === "string") {
      if (liveUrl !== "" && !isHttpUrl(liveUrl)) {
        return NextResponse.json({ error: "Live URL must start with http:// or https://" }, { status: 400 });
      }
      data.liveUrl = liveUrl;
    }

    const project = await prisma.project.update({ where: { id: projectId }, data });
    return NextResponse.json(project);
  } catch (error) {
    console.error("[PATCH /api/projects/[id]]", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
