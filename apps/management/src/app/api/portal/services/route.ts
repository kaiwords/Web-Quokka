import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser } from "@/lib/portalAuth";

// GET /api/portal/services — read-only: this business's domain/hosting/etc.
// Staff picks the provider; the business just sees it (no write route here).
export async function GET() {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const services = await prisma.service.findMany({
    where: { clientId: sessionUser.clientId },
    orderBy: { type: "asc" },
  });

  return NextResponse.json(services);
}
