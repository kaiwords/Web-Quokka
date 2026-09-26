import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/projects/[id]/updates — admin only: post an update to a project's feed.
// Body: { body, imageUrls?: string[], links?: string[] }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { body, imageUrls, links } = await req.json();
    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Update body is required" }, { status: 400 });
    }

    // Only http(s) — these render as links/images in the client portal.
    const cleanUrls = (values: unknown): string[] =>
      Array.isArray(values)
        ? values.filter((v): v is string => {
            if (typeof v !== "string") return false;
            try {
              const u = new URL(v);
              return u.protocol === "http:" || u.protocol === "https:";
            } catch {
              return false;
            }
          })
        : [];

    const update = await prisma.projectUpdate.create({
      data: {
        projectId,
        body: body.trim().slice(0, 10000),
        imageUrls: JSON.stringify(cleanUrls(imageUrls)),
        links: JSON.stringify(cleanUrls(links)),
        postedBy: sessionUser.username,
      },
    });

    return NextResponse.json({ ...update, imageUrls: JSON.parse(update.imageUrls), links: JSON.parse(update.links) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects/[id]/updates]", error);
    return NextResponse.json({ error: "Failed to post update" }, { status: 500 });
  }
}
