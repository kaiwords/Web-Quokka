import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET /api/invoices — any logged-in staff user: all clients' invoices.
// Optional ?status=&clientId=&sourceType=&sourceId=.
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const sourceType = searchParams.get("sourceType");
  const sourceId = searchParams.get("sourceId");

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(clientId ? { clientId: parseInt(clientId) } : {}),
      ...(sourceType ? { sourceType } : {}),
      ...(sourceId ? { sourceId: parseInt(sourceId) } : {}),
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
      // The uploaded invoice PDF, when one exists — lets the UI say which
      // document the PDF link will actually serve.
      documents: { select: { id: true, originalName: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { issueDate: "desc" },
  });

  return NextResponse.json(invoices);
}
