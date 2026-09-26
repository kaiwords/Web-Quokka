import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/services/[id] — admin only.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id } = await params;
    const serviceId = parseInt(id);
    if (Number.isNaN(serviceId)) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    const existing = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const { type, provider, planName, notes } = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof type === "string") {
      if (!["Domain", "Hosting", "SSL", "Email", "Other"].includes(type)) {
        return NextResponse.json({ error: "Invalid service type" }, { status: 400 });
      }
      data.type = type;
    }
    if (typeof provider === "string" && provider.trim()) data.provider = provider.trim().slice(0, 300);
    if (typeof planName === "string") data.planName = planName.slice(0, 300);
    if (typeof notes === "string") data.notes = notes.slice(0, 2000);

    const service = await prisma.service.update({ where: { id: serviceId }, data });
    return NextResponse.json(service);
  } catch (error) {
    console.error("[PATCH /api/services/[id]]", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

// DELETE /api/services/[id] — admin only.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id } = await params;
    const serviceId = parseInt(id);
    if (Number.isNaN(serviceId)) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    const existing = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    await prisma.service.delete({ where: { id: serviceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/services/[id]]", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
