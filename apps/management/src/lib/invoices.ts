import { prisma } from "@/lib/prisma";

export const GST_RATE = 0.1; // fixed 10%, AUD

function round2(n: number): string {
  return n.toFixed(2);
}

export function computeGst(amountExGst: string): { gstAmount: string; totalAmount: string } {
  const ex = parseFloat(amountExGst) || 0;
  const gst = ex * GST_RATE;
  return { gstAmount: round2(gst), totalAmount: round2(ex + gst) };
}

// Approve a ChangeRequest/Suggestion and issue its Invoice as ONE guarded
// transaction. The status precondition (updateMany + count check) means two
// simultaneous approvals can't double-invoice, and a failed invoice write
// can't leave the item stuck on "Approved" with nothing to pay.
// Returns null when the item wasn't in an approvable state (caller → 409).
export async function approveWithInvoice(params: {
  sourceType: "ChangeRequest" | "Suggestion";
  sourceId: number;
  clientId: number;
  description: string;
  amountExGst: string; // caller validates > 0 before calling
}) {
  const { gstAmount, totalAmount } = computeGst(params.amountExGst);
  const threadType = params.sourceType;

  return prisma.$transaction(async (tx) => {
    const guarded =
      params.sourceType === "ChangeRequest"
        ? await tx.changeRequest.updateMany({
            where: { id: params.sourceId, clientId: params.clientId, status: "QuoteSent" },
            data: { status: "Approved" },
          })
        : await tx.suggestion.updateMany({
            where: { id: params.sourceId, clientId: params.clientId, status: { in: ["Proposed", "Snoozed"] } },
            data: { status: "Approved" },
          });
    if (guarded.count === 0) return null;

    await tx.message.create({
      data: {
        threadType,
        threadId: params.sourceId,
        authorType: "System",
        authorName: "System",
        body: "Approved — an invoice has been issued.",
      },
    });

    return tx.invoice.create({
      data: {
        clientId: params.clientId,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        description: params.description,
        amountExGst: round2(parseFloat(params.amountExGst) || 0),
        gstAmount,
        totalAmount,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    });
  });
}

// Legacy helper kept for the manual-invoice route.
export async function createInvoiceForSource(params: {
  clientId: number;
  sourceType: "ChangeRequest" | "Suggestion" | "Manual";
  sourceId: number | null;
  description: string;
  amountExGst: string;
}) {
  const { gstAmount, totalAmount } = computeGst(params.amountExGst);
  return prisma.invoice.create({
    data: {
      clientId: params.clientId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      description: params.description,
      amountExGst: round2(parseFloat(params.amountExGst) || 0),
      gstAmount,
      totalAmount,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  });
}

// Called once an invoice's payment succeeds (real or stubbed — see
// src/lib/payments.ts). Advances whatever it was paying for to InProgress
// and leaves a system note on that thread, so paying an invoice always has
// the same downstream effect regardless of source.
//
// Idempotent and transactional: a double submit finds the invoice already
// Paid (count 0) and returns without paying, messaging, or advancing twice.
// The source only advances from "Approved" — a Completed item is never
// yanked back to InProgress — and a missing source (deleted) is skipped
// rather than failing a payment that already succeeded.
export async function markInvoicePaidAndAdvanceSource(
  invoiceId: number
): Promise<{ invoice: NonNullable<Awaited<ReturnType<typeof prisma.invoice.findUnique>>>; alreadyPaid: boolean }> {
  return prisma.$transaction(async (tx) => {
    const guarded = await tx.invoice.updateMany({
      where: { id: invoiceId, status: { not: "Paid" } },
      data: { status: "Paid", paidAt: new Date() },
    });

    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    if (guarded.count === 0) {
      return { invoice, alreadyPaid: true };
    }

    if (invoice.sourceType === "ChangeRequest" && invoice.sourceId) {
      const advanced = await tx.changeRequest.updateMany({
        where: { id: invoice.sourceId, status: "Approved" },
        data: { status: "InProgress" },
      });
      if (advanced.count > 0) {
        await tx.message.create({
          data: { threadType: "ChangeRequest", threadId: invoice.sourceId, authorType: "System", authorName: "System", body: "Payment received — work has started." },
        });
      }
    } else if (invoice.sourceType === "Suggestion" && invoice.sourceId) {
      const advanced = await tx.suggestion.updateMany({
        where: { id: invoice.sourceId, status: "Approved" },
        data: { status: "InProgress" },
      });
      if (advanced.count > 0) {
        await tx.message.create({
          data: { threadType: "Suggestion", threadId: invoice.sourceId, authorType: "System", authorName: "System", body: "Payment received — work has started." },
        });
      }
    }

    return { invoice, alreadyPaid: false };
  });
}
