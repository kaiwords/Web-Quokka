import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser } from "@/lib/portalAuth";
import { renderInvoicePdf } from "@/lib/invoicePdf";
import { readDocumentFile } from "@/lib/documents";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/portal/invoices/[id]/pdf — any logged-in portal user (no role
// gate — downloading a tax invoice isn't a mutating action, same as viewing
// one). Scoped to the caller's own business. When staff uploaded the invoice
// as a PDF, that file is what the client gets; otherwise it's generated.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id: parseInt(id), clientId: sessionUser.clientId },
    include: {
      client: { select: { name: true, company: true, contactEmail: true } },
      documents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const uploaded = invoice.documents[0];
  const pdf = uploaded
    ? await readDocumentFile(invoice.clientId, uploaded.fileName)
    : await renderInvoicePdf(invoice, invoice.client);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="INV-${String(invoice.id).padStart(4, "0")}.pdf"`,
    },
  });
}
