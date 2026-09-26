import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { logAudit } from "@/lib/auditLog";

// Constant dummy hash so unknown usernames still pay the scrypt cost —
// otherwise response timing reveals which usernames exist.
const DUMMY_HASH = hashPassword("dummy-timing-equalizer");

// POST /api/auth/login — { username, password } -> sets session cookie
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Two windows: per-IP (broad brute force) and per-username (one account
    // attacked from many IPs). The header is client-controlled, so the
    // per-username key is the one that actually holds.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const usernameKey = username.trim().toLowerCase();
    if (
      isRateLimited(`staff-login:ip:${ip}`, 20, 5 * 60 * 1000) ||
      isRateLimited(`staff-login:user:${usernameKey}`, 10, 5 * 60 * 1000)
    ) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in a few minutes." },
        { status: 429 }
      );
    }

    // Exact match first; fall back to the normalised form so "Admin@X.com"
    // finds the account stored as "admin@x.com".
    const user =
      (await prisma.user.findUnique({ where: { username } })) ??
      (await prisma.user.findUnique({ where: { username: usernameKey } }));

    const passwordOk = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !passwordOk) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    await logAudit({
      actorType: "Staff",
      actorId: user.id,
      actorLabel: user.username,
      action: "login",
      targetType: "User",
      targetId: user.id,
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
