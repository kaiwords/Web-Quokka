import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createPortalSession, PORTAL_SESSION_COOKIE } from "@/lib/portalAuth";
import { isRateLimited } from "@/lib/rateLimit";
import { logAudit } from "@/lib/auditLog";

const INVALID = "This confirmation link is invalid or has expired.";

// GET /api/portal/auth/verify-email?token=... — check a token without
// consuming it, so the page can show a useful state before acting.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const record = await prisma.portalEmailVerification.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: INVALID }, { status: 400 });
  }
  const user = await prisma.portalUser.findUnique({ where: { id: record.portalUserId } });
  if (!user) return NextResponse.json({ error: INVALID }, { status: 400 });

  return NextResponse.json({ email: user.email, name: user.name });
}

// POST /api/portal/auth/verify-email — { token } -> activates the account and
// signs them in.
//
// Consuming the token is the one moment the address is proven, so it is also
// the only safe moment to hand out a session without asking for the password
// again. It is a POST, not the emailed GET, because link scanners and mail
// previewers follow GETs — a one-shot token would be burned before the human
// ever clicked.
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (typeof token !== "string" || !token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`portal-verify:ip:${ip}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
    }

    const record = await prisma.portalEmailVerification.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: INVALID }, { status: 400 });
    }

    const user = await prisma.portalUser.findUnique({ where: { id: record.portalUserId } });
    if (!user) return NextResponse.json({ error: INVALID }, { status: 400 });
    // Staff disabled this account between sign-up and click. Burn the token
    // so it cannot be used later, and do not sign them in.
    if (user.status === "Disabled") {
      await prisma.portalEmailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      return NextResponse.json(
        { error: "This account has been disabled. Contact support for help." },
        { status: 403 }
      );
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.portalEmailVerification.update({ where: { id: record.id }, data: { usedAt: now } }),
      prisma.portalUser.update({
        where: { id: user.id },
        data: { status: "Active", emailVerifiedAt: user.emailVerifiedAt ?? now },
      }),
      // Any other outstanding link for this account is now redundant.
      prisma.portalEmailVerification.updateMany({
        where: { portalUserId: user.id, usedAt: null, id: { not: record.id } },
        data: { usedAt: now },
      }),
    ]);

    const { token: sessionToken, expiresAt } = await createPortalSession(user.id);
    const store = await cookies();
    store.set(PORTAL_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    await logAudit({
      actorType: "Portal",
      actorId: user.id,
      actorLabel: user.email,
      action: "verify-email",
      targetType: "PortalUser",
      targetId: user.id,
    });

    return NextResponse.json({ success: true, name: user.name, email: user.email });
  } catch (error) {
    console.error("[POST /api/portal/auth/verify-email]", error);
    return NextResponse.json({ error: "Could not confirm your email." }, { status: 500 });
  }
}
