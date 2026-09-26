import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { SUGGESTION_STATUS_LABELS } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/suggestions/[id] — detail + message thread + attachments.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const suggestionId = parseInt(id);
  const suggestion = await prisma.suggestion.findUnique({
    where: { id: suggestionId },
    include: { client: { select: { id: true, name: true, company: true } }, documents: true },
  });
  if (!suggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });

  const messages = await prisma.message.findMany({ where: { threadType: "Suggestion", threadId: suggestionId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ ...suggestion, messages });
}

// PATCH /api/suggestions/[id] — admin only: edit details/price while still
// awaiting a decision, or mark Completed once the paid work is done.
// Approve/snooze/decline are the business's decisions (portal route), and
// InProgress is set by payment — staff can't set those here, since doing so
// would skip the invoice, or (by resetting a paid one to Proposed) let the
// business approve again and get invoiced twice for the same work.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const suggestionId = parseInt(id);
    const { title, description, expectedBenefit, priority, estimatedCost, estimatedTime, includedInPlan, status } = await req.json();

    const current = await prisma.suggestion.findUnique({ where: { id: suggestionId } });
    if (!current) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });

    if (typeof status === "string" && !(status === "Completed" && current.status === "InProgress")) {
      return NextResponse.json({ error: "Staff can only mark an in-progress suggestion as Completed" }, { status: 400 });
    }

    const awaitingDecision = ["Proposed", "Snoozed"].includes(current.status);
    const changesPrice = typeof estimatedCost === "string" || typeof estimatedTime === "string" || typeof includedInPlan === "boolean";
    if (changesPrice && !awaitingDecision) {
      return NextResponse.json({ error: "The price can't change after the business has decided — the invoice uses the price they approved" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (typeof title === "string") data.title = title;
    if (typeof description === "string") data.description = description;
    if (typeof expectedBenefit === "string") data.expectedBenefit = expectedBenefit;
    if (typeof priority === "string") data.priority = priority;
    if (typeof estimatedCost === "string") {
      if (estimatedCost !== "" && !(parseFloat(estimatedCost) > 0)) {
        return NextResponse.json({ error: "Price must be a number greater than 0, e.g. 450.00" }, { status: 400 });
      }
      data.estimatedCost = estimatedCost === "" ? "" : parseFloat(estimatedCost).toFixed(2);
    }
    if (typeof estimatedTime === "string") data.estimatedTime = estimatedTime;
    if (typeof includedInPlan === "boolean") data.includedInPlan = includedInPlan;
    if (typeof status === "string") data.status = status;

    const suggestion = await prisma.suggestion.update({ where: { id: suggestionId }, data });

    if (typeof status === "string") {
      // Client-visible thread note: display label, no staff username.
      const label = SUGGESTION_STATUS_LABELS[status as keyof typeof SUGGESTION_STATUS_LABELS] ?? status;
      await prisma.message.create({
        data: { threadType: "Suggestion", threadId: suggestionId, authorType: "System", authorName: "System", body: `Status changed to "${label}".` },
      });
    }

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("[PATCH /api/suggestions/[id]]", error);
    return NextResponse.json({ error: "Failed to update suggestion" }, { status: 500 });
  }
}
