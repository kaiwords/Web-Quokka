import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mailer";
import { isRateLimited } from "@/lib/rateLimit";
import { normalizeEmail } from "@/lib/validate";

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

// POST /api/portal/auth/forgot-password — { email }. Always returns a
// generic success message regardless of whether the email exists, to avoid
// leaking account existence. The actual reset link only ever goes out via
// sendMail (stubbed to a server log this phase) — never in this response.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email !== "string" || !email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Per-IP window (broad abuse) plus per-email window so one victim's
    // inbox can't be flooded with reset mails from many IPs.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const emailKey = email.trim().toLowerCase();
    if (
      isRateLimited(`portal-forgot:ip:${ip}`, 10, 15 * 60 * 1000) ||
      isRateLimited(`portal-forgot:email:${emailKey}`, 3, 60 * 60 * 1000)
    ) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const normalized = normalizeEmail(email);
    const portalUser =
      (await prisma.portalUser.findUnique({ where: { email } })) ??
      (normalized ? await prisma.portalUser.findUnique({ where: { email: normalized } }) : null);
    if (portalUser && portalUser.status !== "Disabled") {
      const token = generateToken();
      await prisma.portalPasswordReset.create({
        data: { portalUserId: portalUser.id, token, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
      });
      // Fall back to the request origin so emails never carry a relative
      // (broken) link when NEXT_PUBLIC_APP_URL isn't set.
      const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
      const resetUrl = `${base}/portal/reset-password?token=${token}`;
      await sendMail({
        to: portalUser.email,
        subject: "Reset your Web Quokka client portal password",
        html: `<p>Click the link below to reset your password (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    }

    return NextResponse.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("[POST /api/portal/auth/forgot-password]", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
