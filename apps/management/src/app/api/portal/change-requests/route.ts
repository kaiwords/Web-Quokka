import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";
import { parseDate } from "@/lib/validate";
import { notifyMany, adminUserIds } from "@/lib/notify";

// GET /api/portal/change-requests — this business's change/update requests.
export async function GET() {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const changeRequests = await prisma.changeRequest.findMany({
    where: { clientId: sessionUser.clientId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(changeRequests);
}

// POST /api/portal/change-requests — Manager+: submit a new change request.
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't submit change requests" }, { status: 403 });
    }

    const { title, description, pageSection, referenceLinks, desiredDeadline, projectId } = await req.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let deadline: Date | null = null;
    if (desiredDeadline) {
      deadline = parseDate(desiredDeadline);
      if (!deadline) return NextResponse.json({ error: "Invalid deadline date" }, { status: 400 });
    }

    let validProjectId: number | null = null;
    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: parseInt(projectId), clientId: sessionUser.clientId } });
      validProjectId = project?.id ?? null;
    }

    const changeRequest = await prisma.changeRequest.create({
      data: {
        clientId: sessionUser.clientId,
        projectId: validProjectId,
        title: title.trim().slice(0, 300),
        description: typeof description === "string" ? description.slice(0, 10000) : "",
        pageSection: typeof pageSection === "string" ? pageSection.slice(0, 500) : "",
        referenceLinks: typeof referenceLinks === "string" ? referenceLinks.slice(0, 2000) : "",
        desiredDeadline: deadline,
        createdByPortalUserId: sessionUser.id,
      },
    });

    // A change request arrives unassigned, so it goes to every admin —
    // otherwise a client submission can sit unseen.
    await notifyMany(await adminUserIds(), {
      type: "ChangeRequestSubmitted",
      title: `New change request: ${changeRequest.title}`,
      body: `${sessionUser.name} submitted it.`,
      link: `/change-requests/${changeRequest.id}`,
    });

    return NextResponse.json(changeRequest, { status: 201 });
  } catch (error) {
    console.error("[POST /api/portal/change-requests]", error);
    return NextResponse.json({ error: "Failed to submit change request" }, { status: 500 });
  }
}
