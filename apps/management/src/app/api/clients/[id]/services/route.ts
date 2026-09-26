import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/clients/[id]/services — any logged-in staff user.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const services = await prisma.service.findMany({ where: { clientId: parseInt(id) }, orderBy: { type: "asc" } });
  return NextResponse.json(services);
}

// POST /api/clients/[id]/services — admin only: add a domain/hosting/etc record.
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

    const { type, provider, planName, notes } = await req.json();
    if (typeof type !== "string" || typeof provider !== "string" || !provider.trim()) {
      return NextResponse.json({ error: "type and provider are required" }, { status: 400 });
    }
    if (!["Domain", "Hosting", "SSL", "Email", "Other"].includes(type)) {
      return NextResponse.json({ error: "Invalid service type" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        clientId,
        type,
        provider: provider.trim().slice(0, 300),
        planName: typeof planName === "string" ? planName.slice(0, 300) : "",
        notes: typeof notes === "string" ? notes.slice(0, 2000) : "",
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clients/[id]/services]", error);
    return NextResponse.json({ error: "Failed to add service" }, { status: 500 });
  }
}
