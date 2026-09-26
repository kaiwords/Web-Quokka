import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET /api/notifications — the signed-in user's own inbox, newest first.
// Always scoped to the session user: there is no way to read anyone else's,
// not even for an admin, so no id is accepted from the caller.
// ?unreadOnly=true — just the unread ones (the bell's badge poll).
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: sessionUser.id, ...(unreadOnly ? { readAt: null } : {}) },
        orderBy: { createdAt: "desc" },
        // The bell is a glance, not an archive — cap it so a long-running
        // account doesn't ship thousands of rows on every poll.
        take: 30,
      }),
      prisma.notification.count({ where: { userId: sessionUser.id, readAt: null } }),
    ]);

    return NextResponse.json({ items, unreadCount });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark as read.
// Body: { id: number } for one, or { all: true } for the whole inbox.
// The where-clause is always ANDed with the session user's id, so passing
// somebody else's notification id marks nothing rather than erroring.
export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const body = await req.json();
    const now = new Date();

    if (body?.all === true) {
      const { count } = await prisma.notification.updateMany({
        where: { userId: sessionUser.id, readAt: null },
        data: { readAt: now },
      });
      return NextResponse.json({ updated: count });
    }

    if (!Number.isInteger(body?.id)) {
      return NextResponse.json({ error: "id or all:true is required" }, { status: 400 });
    }

    const { count } = await prisma.notification.updateMany({
      where: { id: body.id, userId: sessionUser.id, readAt: null },
      data: { readAt: now },
    });
    return NextResponse.json({ updated: count });
  } catch (error) {
    console.error("[PATCH /api/notifications]", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
