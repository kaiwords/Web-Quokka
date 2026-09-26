import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";

// GET /api/portal/tickets — this business's support tickets.
// Optional ?status=&priority=&category=&q= filters.
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  const tickets = await prisma.ticket.findMany({
    where: {
      source: "Client",
      clientId: sessionUser.clientId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(category ? { category } : {}),
      ...(q ? { title: { contains: q } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

// POST /api/portal/tickets — Manager+: raise a new support ticket.
// Body: { title, category, priority, description }
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't raise tickets" }, { status: 403 });
    }

    const { title, category, priority, description } = await req.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    // Fixed-value fields: fall back to a safe default instead of storing
    // arbitrary text the UIs can't render.
    const CATEGORIES = ["Bug", "ContentUpdate", "TechnicalQuestion", "Billing", "Other"];
    const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
    const safeCategory = CATEGORIES.includes(category) ? category : "Other";
    const safePriority = PRIORITIES.includes(priority) ? priority : "Medium";

    const ticket = await prisma.ticket.create({
      data: {
        source: "Client",
        title: title.trim().slice(0, 300),
        category: safeCategory,
        priority: safePriority,
        status: "Open",
        description: typeof description === "string" ? description.slice(0, 10000) : "",
        clientId: sessionUser.clientId,
        createdByPortalUserId: sessionUser.id,
        createdBy: sessionUser.name,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("[POST /api/portal/tickets]", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
