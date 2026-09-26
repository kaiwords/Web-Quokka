import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { renderInvoicePdf } from "@/lib/invoicePdf";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/invoices/[id]/pdf — any logged-in staff user.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(id) },
    include: { client: { select: { name: true, company: true, contactEmail: true } } },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const pdf = await renderInvoicePdf(invoice, invoice.client);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="INV-${String(invoice.id).padStart(4, "0")}.pdf"`,
    },
  });
}
