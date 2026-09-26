import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser } from "@/lib/portalAuth";

// GET /api/portal/invoices — this business's invoices. Optional
// ?sourceType=&sourceId= so the change-request/suggestion detail pages can
// fetch "my linked invoice" without a separate endpoint per feature.
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sourceType = searchParams.get("sourceType");
  const sourceId = searchParams.get("sourceId");

  const invoices = await prisma.invoice.findMany({
    where: {
      clientId: sessionUser.clientId,
      ...(sourceType ? { sourceType } : {}),
      ...(sourceId ? { sourceId: parseInt(sourceId) } : {}),
    },
    orderBy: { issueDate: "desc" },
  });

  return NextResponse.json(invoices);
}
