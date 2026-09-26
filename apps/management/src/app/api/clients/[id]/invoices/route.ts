import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { computeGst } from "@/lib/invoices";
import { logAudit } from "@/lib/auditLog";
import { parseDate, parseMoney } from "@/lib/validate";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/clients/[id]/invoices — any logged-in staff user.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const invoices = await prisma.invoice.findMany({ where: { clientId: parseInt(id) }, orderBy: { issueDate: "desc" } });
  return NextResponse.json(invoices);
}

// POST /api/clients/[id]/invoices — admin only: a manual invoice, for
// anything that isn't an approved change request/suggestion (the "create
// invoices" admin capability the spec calls for).
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const clientId = parseInt(id);
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const { description, amountExGst, dueDate } = await req.json();
    if (typeof description !== "string" || !description.trim() || !amountExGst) {
      return NextResponse.json({ error: "description and amountExGst are required" }, { status: 400 });
    }

    // Reject "abc" (was stored as "NaN"), 0, negatives, "1,500".
    const amount = parseMoney(amountExGst);
    if (!amount) {
      return NextResponse.json({ error: "Amount must be a number greater than 0, e.g. 450.00" }, { status: 400 });
    }
    let due = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    if (dueDate) {
      const parsed = parseDate(dueDate);
      if (!parsed) return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
      due = parsed;
    }

    const { gstAmount, totalAmount } = computeGst(amount);
    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        sourceType: "Manual",
        description: description.trim().slice(0, 1000),
        amountExGst: amount,
        gstAmount,
        totalAmount,
        dueDate: due,
      },
    });

    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: "create-manual-invoice",
      targetType: "Invoice",
      targetId: invoice.id,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clients/[id]/invoices]", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
