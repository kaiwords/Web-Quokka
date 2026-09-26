import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { markInvoicePaidAndAdvanceSource } from "@/lib/invoices";
import { logAudit } from "@/lib/auditLog";
import { parseId } from "@/lib/validate";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/invoices/[id] — admin only: mark Paid (e.g. an offline bank
// transfer — reuses the same pay-and-advance-source logic a portal payment
// triggers), or Overdue/Void. Every manual status change is audited.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const invoiceId = parseId(id);
    if (invoiceId === null) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const { status } = await req.json();
    if (!["Unpaid", "Paid", "Overdue", "Void"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (status === invoice.status) {
      return NextResponse.json(invoice);
    }

    let updated;
    if (status === "Paid") {
      ({ invoice: updated } = await markInvoicePaidAndAdvanceSource(invoiceId));
    } else {
      // Leaving Paid: clear the paid date too, so an un-paid invoice doesn't
      // still claim a payment date. (The linked request's progress is left
      // alone — rewinding work state is a human decision, not a side effect.)
      updated = await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status, ...(invoice.status === "Paid" ? { paidAt: null } : {}) },
      });
    }

    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: `invoice-status:${invoice.status}->${status}`,
      targetType: "Invoice",
      targetId: invoiceId,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/invoices/[id]]", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}
