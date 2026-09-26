import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";
import { logAudit } from "@/lib/auditLog";
import { approveWithInvoice } from "@/lib/invoices";
import { notifyMany, adminUserIds } from "@/lib/notify";
import { parseId, parseMoney } from "@/lib/validate";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/portal/change-requests/[id] — detail + its message thread + attachments.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const changeRequestId = parseInt(id);
  const changeRequest = await prisma.changeRequest.findFirst({
    where: { id: changeRequestId, clientId: sessionUser.clientId },
    include: { documents: true },
  });
  if (!changeRequest) return NextResponse.json({ error: "Change request not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { threadType: "ChangeRequest", threadId: changeRequestId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ...changeRequest, messages });
}

// PATCH /api/portal/change-requests/[id] — Manager+: respond to a sent
// quote. Body: { decision: "Approved" | "Declined" }. Approving one that
// isn't "included in plan" issues an Invoice and holds at "Approved" until
// it's paid (src/lib/invoices.ts flips it to InProgress on payment) — it no
// longer jumps straight to InProgress.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't respond to quotes" }, { status: 403 });
    }

    const { id } = await params;
    const changeRequestId = parseId(id);
    if (changeRequestId === null) {
      return NextResponse.json({ error: "Invalid change request id" }, { status: 400 });
    }
    const { decision } = await req.json();
    if (!["Approved", "Declined"].includes(decision)) {
      return NextResponse.json({ error: "decision must be Approved or Declined" }, { status: 400 });
    }

    const changeRequest = await prisma.changeRequest.findFirst({ where: { id: changeRequestId, clientId: sessionUser.clientId } });
    if (!changeRequest) return NextResponse.json({ error: "Change request not found" }, { status: 404 });

    // A decision is only valid while one is actually pending. Before this
    // guard, "included in plan" allowed deciding from ANY status — a
    // Completed request could be declined, an InProgress one re-approved.
    const decidableStatuses = changeRequest.includedInPlan
      ? ["Submitted", "UnderReview", "QuoteSent"]
      : ["QuoteSent"];
    if (!decidableStatuses.includes(changeRequest.status)) {
      return NextResponse.json({ error: "This request doesn't have a quote awaiting a response" }, { status: 409 });
    }

    if (decision === "Declined") {
      const guarded = await prisma.changeRequest.updateMany({
        where: { id: changeRequestId, status: { in: decidableStatuses } },
        data: { status: "Declined" },
      });
      if (guarded.count === 0) {
        return NextResponse.json({ error: "This request has already been decided" }, { status: 409 });
      }
      await prisma.message.create({
        data: { threadType: "ChangeRequest", threadId: changeRequestId, authorType: "System", authorName: "System", body: "The business declined this quote." },
      });
      await logAudit({ actorType: "Portal", actorId: sessionUser.id, actorLabel: sessionUser.email, action: "decline_change_request", targetType: "ChangeRequest", targetId: changeRequestId });
      await notifyMany(await adminUserIds(), {
        type: "ChangeRequestStatus",
        title: `Quote declined: ${changeRequest.title}`,
        body: `${sessionUser.name} declined the quote.`,
        link: `/change-requests/${changeRequestId}`,
      });
      const updated = await prisma.changeRequest.findUnique({ where: { id: changeRequestId } });
      return NextResponse.json(updated);
    }

    if (changeRequest.includedInPlan) {
      const guarded = await prisma.changeRequest.updateMany({
        where: { id: changeRequestId, status: { in: decidableStatuses } },
        data: { status: "InProgress" },
      });
      if (guarded.count === 0) {
        return NextResponse.json({ error: "This request has already been decided" }, { status: 409 });
      }
      await prisma.message.create({
        data: { threadType: "ChangeRequest", threadId: changeRequestId, authorType: "System", authorName: "System", body: "Approved (included in plan) — work has started." },
      });
      await logAudit({ actorType: "Portal", actorId: sessionUser.id, actorLabel: sessionUser.email, action: "approve_change_request", targetType: "ChangeRequest", targetId: changeRequestId });
      await notifyMany(await adminUserIds(), {
        type: "ChangeRequestStatus",
        title: `Quote approved: ${changeRequest.title}`,
        body: `${sessionUser.name} approved it (included in plan) — work can start.`,
        link: `/change-requests/${changeRequestId}`,
      });
      const updated = await prisma.changeRequest.findUnique({ where: { id: changeRequestId } });
      return NextResponse.json(updated);
    }

    // A "TBC" or zero quote must never turn into a $0.00 invoice.
    const amount = parseMoney(changeRequest.quoteAmount);
    if (!amount) {
      return NextResponse.json(
        { error: "This quote doesn't have a confirmed price yet — we'll confirm it before you approve." },
        { status: 400 }
      );
    }

    const invoice = await approveWithInvoice({
      sourceType: "ChangeRequest",
      sourceId: changeRequestId,
      clientId: sessionUser.clientId,
      description: changeRequest.title,
      amountExGst: amount,
    });
    if (!invoice) {
      return NextResponse.json({ error: "This request has already been decided" }, { status: 409 });
    }

    await logAudit({
      actorType: "Portal",
      actorId: sessionUser.id,
      actorLabel: sessionUser.email,
      action: "approve_change_request",
      targetType: "ChangeRequest",
      targetId: changeRequestId,
    });
    await notifyMany(await adminUserIds(), {
      type: "ChangeRequestStatus",
      title: `Quote approved: ${changeRequest.title}`,
      body: `${sessionUser.name} approved it — invoice #${invoice.id} raised, work starts once it's paid.`,
      link: `/change-requests/${changeRequestId}`,
    });

    const updated = await prisma.changeRequest.findUnique({ where: { id: changeRequestId } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/portal/change-requests/[id]]", error);
    return NextResponse.json({ error: "Failed to record decision" }, { status: 500 });
  }
}
