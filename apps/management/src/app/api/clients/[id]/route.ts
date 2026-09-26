import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { deleteClientFiles } from "@/lib/documents";
import { logAudit } from "@/lib/auditLog";
import { parseDate, parseId } from "@/lib/validate";
import { CLIENT_STAGES, PAYMENT_STATUS_LABELS } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/clients/[id] — full client detail with requirements + tasks
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { id } = await params;
    const clientId = parseId(id);
    if (clientId === null) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        requirements: { orderBy: { createdAt: "asc" } },
        tasks: { orderBy: { createdAt: "asc" } },
        documents: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("[GET /api/clients/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

// Only these scalar fields are editable here. The body used to be spread
// straight into prisma's `data`, which also accepts nested relation writes
// — so any logged-in staff user could send e.g. `portalUsers: { create/
// deleteMany }` and grant or revoke a business's portal access, bypassing
// the admin-only portal-users routes.
const EDITABLE_STRING_FIELDS = [
  "name",
  "company",
  "contactEmail",
  "contactPhone",
  "notes",
  "stage",
  "paymentStatus",
  "amountPaid",
  "totalAmount",
] as const;

const PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_LABELS);

// PATCH /api/clients/[id] — any logged-in staff user: update stage, payment,
// MVP milestones, contact info, or notes. Pass mvpSentAt/mvpApprovedAt as
// ISO strings (or null to clear).
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { id } = await params;
    const clientId = parseId(id);
    if (clientId === null) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const existing = await prisma.client.findUnique({ where: { id: clientId } });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await req.json();

    const data: Record<string, unknown> = {};
    for (const field of EDITABLE_STRING_FIELDS) {
      if (typeof body[field] === "string") data[field] = body[field].slice(0, 5000);
    }
    // Fixed-value fields must actually be one of their values.
    if (typeof data.stage === "string" && !(CLIENT_STAGES as string[]).includes(data.stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    if (typeof data.paymentStatus === "string" && !PAYMENT_STATUSES.includes(data.paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }
    // Amounts: free text used to be stored verbatim. Allow "" (unset),
    // otherwise require a non-negative number.
    for (const money of ["amountPaid", "totalAmount"] as const) {
      if (typeof data[money] === "string" && data[money] !== "") {
        const trimmed = (data[money] as string).trim();
        if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
          return NextResponse.json({ error: `${money === "amountPaid" ? "Amount paid" : "Total amount"} must be a number, e.g. 1500.00` }, { status: 400 });
        }
        data[money] = parseFloat(trimmed).toFixed(2);
      }
    }
    if ("mvpSentAt" in body) {
      if (body.mvpSentAt === null || body.mvpSentAt === "") data.mvpSentAt = null;
      else {
        const d = parseDate(body.mvpSentAt);
        if (!d) return NextResponse.json({ error: "Invalid mvpSentAt date" }, { status: 400 });
        data.mvpSentAt = d;
      }
    }
    if ("mvpApprovedAt" in body) {
      if (body.mvpApprovedAt === null || body.mvpApprovedAt === "") data.mvpApprovedAt = null;
      else {
        const d = parseDate(body.mvpApprovedAt);
        if (!d) return NextResponse.json({ error: "Invalid mvpApprovedAt date" }, { status: 400 });
        data.mvpApprovedAt = d;
      }
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data,
      include: {
        requirements: { orderBy: { createdAt: "asc" } },
        tasks: { orderBy: { createdAt: "asc" } },
        documents: { orderBy: { createdAt: "desc" } },
      },
    });

    // Money-field edits leave a trail (payment status, amounts).
    const touchedPayment = ["paymentStatus", "amountPaid", "totalAmount"].some(
      (f) => f in data && data[f] !== (existing as Record<string, unknown>)[f]
    );
    if (touchedPayment) {
      await logAudit({
        actorType: "Staff",
        actorId: sessionUser.id,
        actorLabel: sessionUser.username,
        action: "client-payment-fields-edit",
        targetType: "Client",
        targetId: clientId,
      });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("[PATCH /api/clients/[id]]", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

// DELETE /api/clients/[id] — admin only. Cascades the business's portal
// users (and so their sessions — they're signed out at once), projects,
// invoices, etc., then removes its uploaded files from disk.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const clientId = parseId(id);
    if (clientId === null) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const existing = await prisma.client.findUnique({ where: { id: clientId } });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    await prisma.client.delete({ where: { id: clientId } });
    await deleteClientFiles(clientId);
    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: "delete_client",
      targetType: "Client",
      targetId: clientId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/clients/[id]]", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
