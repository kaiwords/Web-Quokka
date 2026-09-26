import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/auditLog";
import { parseId } from "@/lib/validate";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/users/[id] — admin only: grant or revoke admin access (and/or
// edit the role/title label). Refuses a change that would leave zero admins,
// so the app can never lock everyone out of user management.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseId(id);
    if (userId === null) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    const { isAdmin, role } = await req.json();

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (isAdmin === false && target.isAdmin) {
      const adminCount = await prisma.user.count({ where: { isAdmin: true } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Can't revoke the last admin — promote someone else first" },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (typeof isAdmin === "boolean") data.isAdmin = isAdmin;
    if (typeof role === "string") data.role = role.trim().slice(0, 60) || "User";
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, role: true, isAdmin: true, createdAt: true },
    });

    // Granting/revoking admin is the most privileged action in the app —
    // always leave a trail of who did it to whom.
    if (typeof isAdmin === "boolean" && isAdmin !== target.isAdmin) {
      await logAudit({
        actorType: "Staff",
        actorId: sessionUser.id,
        actorLabel: sessionUser.username,
        action: isAdmin ? "user-grant-admin" : "user-revoke-admin",
        targetType: "User",
        targetId: userId,
      });
    }
    if (typeof role === "string" && data.role !== target.role) {
      await logAudit({
        actorType: "Staff",
        actorId: sessionUser.id,
        actorLabel: sessionUser.username,
        action: "user-role-change",
        targetType: "User",
        targetId: userId,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PATCH /api/users/[id]]", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/users/[id] — admin only. Refuses to delete yourself or the
// last remaining admin.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseId(id);
    if (userId === null) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    if (userId === sessionUser.id) {
      return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.isAdmin) {
      const adminCount = await prisma.user.count({ where: { isAdmin: true } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Can't delete the last admin" }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: "user-delete",
      targetType: "User",
      targetId: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/users/[id]]", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
