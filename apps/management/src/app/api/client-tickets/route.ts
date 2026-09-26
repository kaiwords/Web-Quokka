import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET /api/client-tickets — admin only: portal-raised support tickets
// (source: "Client") across all businesses. Optional ?status=&priority=&clientId=.
// Only admins handle client-raised tickets — they don't raise one
// themselves, they respond to what the business submits.
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const clientId = searchParams.get("clientId");

  const tickets = await prisma.ticket.findMany({
    where: {
      source: "Client",
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(clientId ? { clientId: parseInt(clientId) } : {}),
    },
    include: { client: { select: { id: true, name: true, company: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tickets);
}
