import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseId, parseMoney } from "@/lib/validate";
import { CHANGE_REQUEST_STATUS_LABELS } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/change-requests/[id] — detail + message thread + attachments.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const changeRequestId = parseInt(id);
  const changeRequest = await prisma.changeRequest.findUnique({
    where: { id: changeRequestId },
    include: { client: { select: { id: true, name: true, company: true } }, documents: true },
  });
  if (!changeRequest) return NextResponse.json({ error: "Change request not found" }, { status: 404 });

  const messages = await prisma.message.findMany({ where: { threadType: "ChangeRequest", threadId: changeRequestId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ ...changeRequest, messages });
}

// Which statuses staff may move a change request INTO, from where. Approved
// is the business's decision (portal route) and InProgress is set by payment
// — staff setting either here would skip the invoice, or (by resetting a
// paid request to QuoteSent) let the business approve and be invoiced twice.
// Mirrors the rule /api/suggestions/[id] already enforces.
const STAFF_TRANSITIONS: Record<string, string[]> = {
  UnderReview: ["Submitted", "QuoteSent"],
  QuoteSent: ["Submitted", "UnderReview"],
  Declined: ["Submitted", "UnderReview", "QuoteSent"],
  Completed: ["InProgress"],
};

const AWAITING_DECISION = ["Submitted", "UnderReview", "QuoteSent"];

// PATCH /api/change-requests/[id] — admin only: move through the review/quote
// workflow. Body may include any of: status, quoteAmount, quoteEstimatedTime,
// includedInPlan.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const changeRequestId = parseId(id);
    if (changeRequestId === null) {
      return NextResponse.json({ error: "Invalid change request id" }, { status: 400 });
    }
    const { status, quoteAmount, quoteEstimatedTime, includedInPlan } = await req.json();

    const current = await prisma.changeRequest.findUnique({ where: { id: changeRequestId } });
    if (!current) return NextResponse.json({ error: "Change request not found" }, { status: 404 });

    const data: Record<string, unknown> = {};

    if (typeof status === "string" && status !== current.status) {
      const allowedFrom = STAFF_TRANSITIONS[status];
      if (!allowedFrom) {
        return NextResponse.json(
          { error: `Staff can't set a request to "${CHANGE_REQUEST_STATUS_LABELS[status as keyof typeof CHANGE_REQUEST_STATUS_LABELS] ?? status}" — approval and payment do that` },
          { status: 400 }
        );
      }
      if (!allowedFrom.includes(current.status)) {
        return NextResponse.json(
          { error: `Can't move from "${CHANGE_REQUEST_STATUS_LABELS[current.status as keyof typeof CHANGE_REQUEST_STATUS_LABELS] ?? current.status}" to "${CHANGE_REQUEST_STATUS_LABELS[status as keyof typeof CHANGE_REQUEST_STATUS_LABELS]}"` },
          { status: 400 }
        );
      }
      data.status = status;
    }

    const changesQuote =
      typeof quoteAmount === "string" || typeof quoteEstimatedTime === "string" || typeof includedInPlan === "boolean";
    if (changesQuote && !AWAITING_DECISION.includes(current.status)) {
      return NextResponse.json(
        { error: "The quote can't change after the business has decided — the invoice uses the price they approved" },
        { status: 400 }
      );
    }
    if (typeof quoteAmount === "string") {
      // Needs to be a plain positive number (ex-GST) so an Invoice can
      // compute GST off it once the client approves — no more freeform
      // "$650 + GST" text, and no 0/negative/"1,500" slipping through.
      if (quoteAmount === "") {
        data.quoteAmount = "";
      } else {
        const parsed = parseMoney(quoteAmount);
        if (!parsed) {
          return NextResponse.json({ error: "Quote must be a number greater than 0, e.g. 650.00" }, { status: 400 });
        }
        data.quoteAmount = parsed;
      }
    }
    if (typeof quoteEstimatedTime === "string") data.quoteEstimatedTime = quoteEstimatedTime.slice(0, 200);
    if (typeof includedInPlan === "boolean") data.includedInPlan = includedInPlan;

    // Sending a quote needs a price to respond to (unless it's covered by
    // the client's plan).
    if (data.status === "QuoteSent") {
      const effectiveAmount = typeof data.quoteAmount === "string" ? data.quoteAmount : current.quoteAmount;
      const effectiveIncluded = typeof data.includedInPlan === "boolean" ? data.includedInPlan : current.includedInPlan;
      if (!effectiveIncluded && !parseMoney(effectiveAmount)) {
        return NextResponse.json({ error: "Set a quote amount before sending the quote" }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(current);
    }

    const changeRequest = await prisma.changeRequest.update({ where: { id: changeRequestId }, data });

    if (typeof data.status === "string") {
      // Client-visible thread note: use the display label, and no staff
      // username (this thread is shown to the business).
      const label = CHANGE_REQUEST_STATUS_LABELS[data.status as keyof typeof CHANGE_REQUEST_STATUS_LABELS] ?? data.status;
      await prisma.message.create({
        data: { threadType: "ChangeRequest", threadId: changeRequestId, authorType: "System", authorName: "System", body: `Status changed to "${label}".` },
      });
    }

    return NextResponse.json(changeRequest);
  } catch (error) {
    console.error("[PATCH /api/change-requests/[id]]", error);
    return NextResponse.json({ error: "Failed to update change request" }, { status: 500 });
  }
}
