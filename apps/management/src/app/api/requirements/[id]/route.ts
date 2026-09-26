import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseId } from "@/lib/validate";

interface Params {
  params: Promise<{ id: string }>;
}

// DELETE /api/requirements/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { id } = await params;
    const requirementId = parseId(id);
    if (requirementId === null) return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    const existing = await prisma.requirement.findUnique({ where: { id: requirementId } });
    if (!existing) return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    await prisma.requirement.delete({ where: { id: requirementId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/requirements/[id]]", error);
    return NextResponse.json({ error: "Failed to delete requirement" }, { status: 500 });
  }
}
