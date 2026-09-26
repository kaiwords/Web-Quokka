import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET /api/change-requests — any logged-in staff user: all businesses'
// change requests. Optional ?status=&clientId=.
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");

  const changeRequests = await prisma.changeRequest.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(clientId ? { clientId: parseInt(clientId) } : {}),
    },
    include: { client: { select: { id: true, name: true, company: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(changeRequests);
}
