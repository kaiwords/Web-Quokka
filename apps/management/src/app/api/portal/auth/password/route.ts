import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser } from "@/lib/portalAuth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isRateLimited } from "@/lib/rateLimit";
import { logAudit } from "@/lib/auditLog";

// PATCH /api/portal/auth/password — the logged-in portal user changes their own password.
// Body: { currentPassword, newPassword }
export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // Otherwise a stolen session could brute-force the current password.
    if (isRateLimited(`portal-pwchange:${sessionUser.id}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const portalUser = await prisma.portalUser.findUnique({ where: { id: sessionUser.id } });
    // 403, not 401 — a 401 here reads as "session expired" to generic
    // client handling, which is the wrong message for a wrong password.
    if (!portalUser || !verifyPassword(currentPassword, portalUser.passwordHash)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    await prisma.portalUser.update({
      where: { id: portalUser.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    await logAudit({
      actorType: "Portal",
      actorId: portalUser.id,
      actorLabel: portalUser.email,
      action: "password-change",
      targetType: "PortalUser",
      targetId: portalUser.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/portal/auth/password]", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
