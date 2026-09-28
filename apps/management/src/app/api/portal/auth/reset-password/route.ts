import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";
import { destroyAllPortalSessions } from "@/lib/portalAuth";
import { isRateLimited } from "@/lib/rateLimit";

// POST /api/portal/auth/reset-password — { token, newPassword }
export async function POST(req: NextRequest) {
  try {
    // Reset tokens are single-use secrets — don't let one IP grind through
    // guesses. Same window as the sibling auth routes.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`portal-reset-password:ip:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in a few minutes." },
        { status: 429 }
      );
    }

    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

    const reset = await prisma.portalPasswordReset.findUnique({ where: { token } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.portalUser.update({
        where: { id: reset.portalUserId },
        data: { passwordHash: hashPassword(newPassword) },
      }),
      prisma.portalPasswordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    ]);
    // Force re-login everywhere — a reset means the old password (and any
    // session established with it) should no longer be trusted.
    await destroyAllPortalSessions(reset.portalUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/portal/auth/reset-password]", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
