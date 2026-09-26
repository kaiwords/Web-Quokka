import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";
import { chargeInvoice } from "@/lib/payments";
import { markInvoicePaidAndAdvanceSource } from "@/lib/invoices";
import { logAudit } from "@/lib/auditLog";
import { notifyMany, adminUserIds } from "@/lib/notify";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/portal/invoices/[id]/pay — Manager+. No Stripe keys are
// configured (see src/lib/payments.ts), so this is a clearly-labeled
// test/demo payment, not a real charge — the client UI must say so.
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't make payments" }, { status: 403 });
    }

    const { id } = await params;
    const invoiceId = parseInt(id);
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, clientId: sessionUser.clientId } });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "Paid") {
      // Idempotent: a double submit isn't an error and must not charge twice.
      return NextResponse.json(invoice);
    }
    if (invoice.status !== "Unpaid" && invoice.status !== "Overdue") {
      return NextResponse.json({ error: "This invoice isn't payable" }, { status: 400 });
    }

    const result = await chargeInvoice();
    if (!result.success) {
      return NextResponse.json({ error: "Payment failed" }, { status: 402 });
    }

    // Guarded + transactional: if a concurrent request paid it first,
    // alreadyPaid comes back true and nothing is advanced or messaged twice.
    const { invoice: paid, alreadyPaid } = await markInvoicePaidAndAdvanceSource(invoiceId);

    if (!alreadyPaid) {
      await logAudit({
        actorType: "Portal",
        actorId: sessionUser.id,
        actorLabel: sessionUser.email,
        action: "pay_invoice",
        targetType: "Invoice",
        targetId: invoiceId,
      });
      await notifyMany(await adminUserIds(), {
        type: "InvoicePaid",
        title: `Invoice #${invoiceId} paid`,
        body: `${sessionUser.name} paid ${paid.totalAmount} for "${paid.description}" — work can start.`,
        link: `/invoices`,
      });
    }

    return NextResponse.json(paid);
  } catch (error) {
    console.error("[POST /api/portal/invoices/[id]/pay]", error);
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}
