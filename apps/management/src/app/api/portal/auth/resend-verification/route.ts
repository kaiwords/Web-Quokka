import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, escapeHtml } from "@/lib/validate";
import { isRateLimited } from "@/lib/rateLimit";
import { generateToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mailer";

const VERIFY_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// POST /api/portal/auth/resend-verification — { email }
//
// Answers the same way for every address, registered or not: this endpoint is
// unauthenticated, so any difference in the reply is an enumeration oracle.
// Mirrors the forgot-password flow.
export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail } = await req.json();
    const email = normalizeEmail(rawEmail);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (
      isRateLimited(`portal-resend:ip:${ip}`, 10, 60 * 60 * 1000) ||
      (email && isRateLimited(`portal-resend:email:${email}`, 5, 60 * 60 * 1000))
    ) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const done = NextResponse.json({
      success: true,
      message: "If that address needs confirming, a new link is on its way.",
    });
    if (!email) return done;

    const user = await prisma.portalUser.findUnique({ where: { email } });
    // Nothing to do for an unknown address, an already-active account, or a
    // disabled one — and in all three cases we say exactly the same thing.
    if (!user || user.status !== "PendingVerification") return done;

    const token = generateToken();
    await prisma.$transaction([
      // Supersede outstanding links so only the newest one works.
      prisma.portalEmailVerification.updateMany({
        where: { portalUserId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.portalEmailVerification.create({
        data: {
          portalUserId: user.id,
          token,
          expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
        },
      }),
    ]);

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    // after(): sent once the response is out (so timing doesn't reveal which
    // addresses exist), and kept alive on Vercel until the send finishes.
    after(() => sendMail({
      to: email,
      subject: "Confirm your WebQuokka account",
      html: `
        <p>Hi ${escapeHtml(user.name)},</p>
        <p>Here's a fresh link to confirm your email address:</p>
        <p><a href="${appUrl}/portal/verify-email?token=${token}">Confirm my email address</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    }));

    return done;
  } catch (error) {
    console.error("[POST /api/portal/auth/resend-verification]", error);
    return NextResponse.json({ error: "Could not resend the link." }, { status: 500 });
  }
}
