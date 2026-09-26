import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser } from "@/lib/portalAuth";

// GET /api/portal/suggestions — this business's developer suggestions.
export async function GET() {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const suggestions = await prisma.suggestion.findMany({
    where: { clientId: sessionUser.clientId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(suggestions);
}
