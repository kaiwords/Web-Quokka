import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/auditLog";

// GET /api/users — admin only: list all user accounts
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, isAdmin: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

// POST /api/users — admin only: create a new user account (id + password).
// `role` is a free-text label the admin types (e.g. "Developer") — it's
// display only. `isAdmin` is the separate, explicit flag that actually
// grants elevated access, so typing "Admin" as a role never grants it.
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { username, password, role, isAdmin } = await req.json();
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Stored lowercase so "JSmith" and "jsmith" can't become two accounts
    // (SQLite compares text case-sensitively).
    const normalized = username.trim().toLowerCase().slice(0, 254);
    const existing = await prisma.user.findFirst({
      where: { username: { in: [normalized, username.trim()] } },
    });
    if (existing) {
      return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        username: normalized,
        passwordHash: hashPassword(password),
        role: typeof role === "string" && role.trim() ? role.trim().slice(0, 60) : "User",
        isAdmin: Boolean(isAdmin),
      },
      select: { id: true, username: true, role: true, isAdmin: true, createdAt: true },
    });

    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: user.isAdmin ? "user-create-admin" : "user-create",
      targetType: "User",
      targetId: user.id,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[POST /api/users]", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
