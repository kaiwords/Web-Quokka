import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";
import { approveWithInvoice } from "@/lib/invoices";
import { logAudit } from "@/lib/auditLog";
import { parseDate, parseId, parseMoney } from "@/lib/validate";
import { notifyAuthorOrAdmins } from "@/lib/notify";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/portal/suggestions/[id] — detail + its message thread.
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const suggestionId = parseInt(id);
  const suggestion = await prisma.suggestion.findFirst({
    where: { id: suggestionId, clientId: sessionUser.clientId },
    include: { documents: true },
  });
  if (!suggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });

  const messages = await prisma.message.findMany({ where: { threadType: "Suggestion", threadId: suggestionId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ ...suggestion, messages });
}

// PATCH /api/portal/suggestions/[id] — Manager+: Approve / snooze ("maybe
// later") / decline. Approving one that isn't "included in plan" creates an
// Invoice and holds at "Approved" until it's paid (see
// src/lib/invoices.ts) — the same pay-then-work-starts flow as change
// requests, not a separate one.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't act on suggestions" }, { status: 403 });
    }

    const { id } = await params;
    const suggestionId = parseId(id);
    if (suggestionId === null) {
      return NextResponse.json({ error: "Invalid suggestion id" }, { status: 400 });
    }
    const suggestion = await prisma.suggestion.findFirst({ where: { id: suggestionId, clientId: sessionUser.clientId } });
    if (!suggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    if (!["Proposed", "Snoozed"].includes(suggestion.status)) {
      return NextResponse.json({ error: "This suggestion has already been decided" }, { status: 409 });
    }

    const { decision, snoozeUntil, reason } = await req.json();

    if (decision === "Declined") {
      const guarded = await prisma.suggestion.updateMany({
        where: { id: suggestionId, status: { in: ["Proposed", "Snoozed"] } },
        data: { status: "Declined", declineReason: typeof reason === "string" ? reason.slice(0, 1000) : "" },
      });
      if (guarded.count === 0) {
        return NextResponse.json({ error: "This suggestion has already been decided" }, { status: 409 });
      }
      await prisma.message.create({
        data: { threadType: "Suggestion", threadId: suggestionId, authorType: "System", authorName: "System", body: "The business declined this suggestion." },
      });
      await logAudit({ actorType: "Portal", actorId: sessionUser.id, actorLabel: sessionUser.email, action: "decline_suggestion", targetType: "Suggestion", targetId: suggestionId });
      // Tell the staff member who proposed it. No actorUserId: the decider
      // is a portal user, never a staff account.
      await notifyAuthorOrAdmins(suggestion.createdBy, {
        type: "SuggestionStatus",
        title: `Suggestion declined: ${suggestion.title}`,
        body: typeof reason === "string" && reason.trim()
          ? `${sessionUser.name} declined it — "${reason.trim().slice(0, 140)}"`
          : `${sessionUser.name} declined it.`,
        link: `/suggestions/${suggestionId}`,
      });
      const updated = await prisma.suggestion.findUnique({ where: { id: suggestionId } });
      return NextResponse.json(updated);
    }

    if (decision === "Snoozed") {
      const until = parseDate(snoozeUntil);
      if (!until) {
        return NextResponse.json({ error: "Pick a date to be reminded on" }, { status: 400 });
      }
      if (until.getTime() <= Date.now()) {
        return NextResponse.json({ error: "The reminder date must be in the future" }, { status: 400 });
      }
      const updated = await prisma.suggestion.update({
        where: { id: suggestionId },
        data: { status: "Snoozed", snoozeUntil: until },
      });
      await logAudit({ actorType: "Portal", actorId: sessionUser.id, actorLabel: sessionUser.email, action: "snooze_suggestion", targetType: "Suggestion", targetId: suggestionId });
      await notifyAuthorOrAdmins(suggestion.createdBy, {
        type: "SuggestionStatus",
        title: `Suggestion snoozed: ${suggestion.title}`,
        body: `${sessionUser.name} asked to be reminded on ${until.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}.`,
        link: `/suggestions/${suggestionId}`,
      });
      return NextResponse.json(updated);
    }

    if (decision === "Approved") {
      if (suggestion.includedInPlan) {
        const guarded = await prisma.suggestion.updateMany({
          where: { id: suggestionId, status: { in: ["Proposed", "Snoozed"] } },
          data: { status: "InProgress" },
        });
        if (guarded.count === 0) {
          return NextResponse.json({ error: "This suggestion has already been decided" }, { status: 409 });
        }
        await prisma.message.create({
          data: { threadType: "Suggestion", threadId: suggestionId, authorType: "System", authorName: "System", body: "Approved (included in plan) — work has started." },
        });
        await logAudit({ actorType: "Portal", actorId: sessionUser.id, actorLabel: sessionUser.email, action: "approve_suggestion", targetType: "Suggestion", targetId: suggestionId });
        await notifyAuthorOrAdmins(suggestion.createdBy, {
          type: "SuggestionStatus",
          title: `Suggestion approved: ${suggestion.title}`,
          body: `${sessionUser.name} approved it (included in plan) — work can start.`,
          link: `/suggestions/${suggestionId}`,
        });
        const updated = await prisma.suggestion.findUnique({ where: { id: suggestionId } });
        return NextResponse.json(updated);
      }

      // A missing/zero estimate must never turn into a $0.00 invoice.
      const amount = parseMoney(suggestion.estimatedCost);
      if (!amount) {
        return NextResponse.json(
          { error: "This suggestion doesn't have a confirmed price yet — we'll confirm it before you approve." },
          { status: 400 }
        );
      }

      const invoice = await approveWithInvoice({
        sourceType: "Suggestion",
        sourceId: suggestionId,
        clientId: sessionUser.clientId,
        description: suggestion.title,
        amountExGst: amount,
      });
      if (!invoice) {
        return NextResponse.json({ error: "This suggestion has already been decided" }, { status: 409 });
      }
      await logAudit({ actorType: "Portal", actorId: sessionUser.id, actorLabel: sessionUser.email, action: "approve_suggestion", targetType: "Suggestion", targetId: suggestionId });
      await notifyAuthorOrAdmins(suggestion.createdBy, {
        type: "SuggestionStatus",
        title: `Suggestion approved: ${suggestion.title}`,
        body: `${sessionUser.name} approved it — invoice #${invoice.id} raised, work starts once it's paid.`,
        link: `/suggestions/${suggestionId}`,
      });
      const updated = await prisma.suggestion.findUnique({ where: { id: suggestionId } });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "decision must be Approved, Snoozed, or Declined" }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /api/portal/suggestions/[id]]", error);
    return NextResponse.json({ error: "Failed to update suggestion" }, { status: 500 });
  }
}
