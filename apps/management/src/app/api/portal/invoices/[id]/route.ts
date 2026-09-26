import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser } from "@/lib/portalAuth";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/portal/invoices/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id: parseInt(id), clientId: sessionUser.clientId } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  return NextResponse.json(invoice);
}
