import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createPortalSession, PORTAL_SESSION_COOKIE } from "@/lib/portalAuth";
import { isRateLimited } from "@/lib/rateLimit";
import { logAudit } from "@/lib/auditLog";

// Constant dummy hash so unknown emails still pay the scrypt cost —
// otherwise response timing reveals which emails have accounts.
const DUMMY_HASH = hashPassword("dummy-timing-equalizer");

// POST /api/portal/auth/login — { email, password } -> sets portal session cookie
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Two windows: per-IP (broad brute force; header is client-controlled)
    // and per-email (one account attacked from many IPs — this is the key
    // that actually holds).
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const emailKey = email.trim().toLowerCase();
    if (
      isRateLimited(`portal-login:ip:${ip}`, 20, 5 * 60 * 1000) ||
      isRateLimited(`portal-login:email:${emailKey}`, 10, 5 * 60 * 1000)
    ) {
      return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
    }

    // Exact match first; fall back to the normalised form so "Jane@X.com"
    // finds the account stored as "jane@x.com".
    const portalUser =
      (await prisma.portalUser.findUnique({ where: { email } })) ??
      (await prisma.portalUser.findUnique({ where: { email: emailKey } }));

    const passwordOk = verifyPassword(password, portalUser?.passwordHash ?? DUMMY_HASH);
    if (!portalUser || portalUser.status === "Disabled" || !passwordOk) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // A self-signed-up account must not be usable until the emailed link is
    // followed, or signing up as someone else's address would grant access to
    // the account created with it. Checked after the password so this cannot
    // be used to probe which addresses are pending.
    if (portalUser.status === "PendingVerification") {
      return NextResponse.json(
        {
          error: "Please confirm your email address first — check your inbox for the link.",
          needsVerification: true,
        },
        { status: 403 }
      );
    }

    if (portalUser.status === "Invited") {
      await prisma.portalUser.update({ where: { id: portalUser.id }, data: { status: "Active" } });
    }

    const { token, expiresAt } = await createPortalSession(portalUser.id);
    const store = await cookies();
    store.set(PORTAL_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    await logAudit({
      actorType: "Portal",
      actorId: portalUser.id,
      actorLabel: portalUser.email,
      action: "login",
      targetType: "PortalUser",
      targetId: portalUser.id,
    });

    return NextResponse.json({
      id: portalUser.id,
      clientId: portalUser.clientId,
      name: portalUser.name,
      email: portalUser.email,
      role: portalUser.role,
    });
  } catch (error) {
    console.error("[POST /api/portal/auth/login]", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
