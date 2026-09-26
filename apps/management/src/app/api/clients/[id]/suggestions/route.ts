import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/auditLog";
import { parseMoney } from "@/lib/validate";
import { SUGGESTION_CATEGORIES } from "@/types";

const SUGGESTION_PRIORITIES = ["Low", "Medium", "High"];

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/clients/[id]/suggestions — admin only: post a developer
// recommendation for this client to review, with the price already
// attached (or includedInPlan) — matches how the client sees it.
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

    const { title, category, description, expectedBenefit, priority, estimatedCost, estimatedTime, includedInPlan, projectId } = await req.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!(SUGGESTION_CATEGORIES as string[]).includes(category)) {
      return NextResponse.json({ error: "Choose a valid category" }, { status: 400 });
    }
    if (priority && !SUGGESTION_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    // The price becomes the invoice amount if the business approves, so it
    // has to be a real number — "abc" would otherwise invoice $0.00, and
    // parseFloat would read "1,500" as 1.
    let price = "";
    if (!includedInPlan) {
      const parsed = parseMoney(estimatedCost);
      if (!parsed) {
        return NextResponse.json({ error: "Enter a price greater than 0 (AUD, ex GST), or mark it included in plan" }, { status: 400 });
      }
      price = parsed;
    }

    // A suggestion may only be linked to one of THIS client's projects —
    // an unchecked id would attach it to another business's project.
    let linkedProjectId: number | null = null;
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: parseInt(String(projectId)), clientId },
      });
      if (!project) {
        return NextResponse.json({ error: "That project doesn't belong to this client" }, { status: 400 });
      }
      linkedProjectId = project.id;
    }

    const suggestion = await prisma.suggestion.create({
      data: {
        clientId,
        projectId: linkedProjectId,
        title: title.trim().slice(0, 300),
        category,
        description: typeof description === "string" ? description.slice(0, 10000) : "",
        expectedBenefit: typeof expectedBenefit === "string" ? expectedBenefit.slice(0, 2000) : "",
        priority: priority || "Medium",
        estimatedCost: price,
        estimatedTime: typeof estimatedTime === "string" ? estimatedTime.slice(0, 200) : "",
        includedInPlan: Boolean(includedInPlan),
        createdBy: sessionUser.username,
      },
    });

    // A suggestion carries a price the business can approve into an invoice,
    // so record who proposed it (manual invoices are audited the same way).
    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: "create-suggestion",
      targetType: "Suggestion",
      targetId: suggestion.id,
    });

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clients/[id]/suggestions]", error);
    return NextResponse.json({ error: "Failed to post suggestion" }, { status: 500 });
  }
}
