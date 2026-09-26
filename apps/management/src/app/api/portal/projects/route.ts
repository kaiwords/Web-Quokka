import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser } from "@/lib/portalAuth";

// GET /api/portal/projects — this business's projects, with progress-bearing milestones.
export async function GET() {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { clientId: sessionUser.clientId },
    include: { milestones: { select: { id: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}
