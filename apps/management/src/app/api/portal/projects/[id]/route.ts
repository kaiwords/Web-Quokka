import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser } from "@/lib/portalAuth";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/portal/projects/[id] — full project detail, scoped to the caller's business.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id: parseInt(id), clientId: sessionUser.clientId },
    include: {
      milestones: { orderBy: { order: "asc" }, include: { tasks: { orderBy: { order: "asc" } } } },
      updates: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const withParsedJson = {
    ...project,
    updates: project.updates.map((u) => ({
      ...u,
      imageUrls: JSON.parse(u.imageUrls || "[]"),
      links: JSON.parse(u.links || "[]"),
    })),
  };

  return NextResponse.json(withParsedJson);
}
