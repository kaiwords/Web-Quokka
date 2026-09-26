import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET /api/suggestions — any logged-in staff user: all clients' suggestions.
// Optional ?status=&clientId=.
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");

  const suggestions = await prisma.suggestion.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(clientId ? { clientId: parseInt(clientId) } : {}),
    },
    include: { client: { select: { id: true, name: true, company: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(suggestions);
}
