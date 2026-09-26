import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";
import { logAudit } from "@/lib/auditLog";

// GET /api/portal/auth/accept-invite?token=... — validate a token before
// showing the "set your password" form.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const invite = await prisma.portalInvite.findUnique({ where: { token }, include: { client: true } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite link is invalid or has expired" }, { status: 400 });
  }

  return NextResponse.json({ email: invite.email, role: invite.role, businessName: invite.client.company || invite.client.name });
}

// POST /api/portal/auth/accept-invite — { token, name, password } -> creates
// the PortalUser account and consumes the invite.
export async function POST(req: NextRequest) {
  try {
    const { token, name, password } = await req.json();
    if (
      typeof token !== "string" ||
      typeof name !== "string" ||
      typeof password !== "string" ||
      !token ||
      !name.trim() ||
      !password
    ) {
      return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
    }
    const passwordError = validatePassword(password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

    const invite = await prisma.portalInvite.findUnique({ where: { token } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite link is invalid or has expired" }, { status: 400 });
    }

    const existing = await prisma.portalUser.findUnique({ where: { email: invite.email } });
    if (existing && existing.clientId !== invite.clientId) {
      return NextResponse.json({ error: "This email is already registered to a different business" }, { status: 409 });
    }
    // An invite must never overwrite a live account: that would let whoever
    // holds the link take over the account (new password, new name) or
    // silently re-enable a user staff had disabled. Only a placeholder
    // "Invited" account (created by an earlier invite flow, never signed in)
    // may be completed here.
    if (existing && existing.status === "Active") {
      return NextResponse.json(
        { error: "An account with this email already exists — sign in instead." },
        { status: 409 }
      );
    }
    if (existing && existing.status === "Disabled") {
      return NextResponse.json(
        { error: "This account has been disabled. Contact support to restore access." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const trimmedName = name.trim().slice(0, 200);

    const [portalUser] = await prisma.$transaction([
      existing
        ? prisma.portalUser.update({
            where: { id: existing.id },
            data: { name: trimmedName, passwordHash, role: invite.role, status: "Active" },
          })
        : prisma.portalUser.create({
            data: {
              clientId: invite.clientId,
              email: invite.email,
              name: trimmedName,
              passwordHash,
              role: invite.role,
              status: "Active",
            },
          }),
      prisma.portalInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
      // Consume any other pending invites for the same email + business so a
      // stale duplicate link can't be replayed later.
      prisma.portalInvite.updateMany({
        where: {
          clientId: invite.clientId,
          email: invite.email,
          acceptedAt: null,
          id: { not: invite.id },
        },
        data: { acceptedAt: new Date() },
      }),
    ]);

    await logAudit({
      actorType: "Portal",
      actorId: portalUser.id,
      actorLabel: invite.email,
      action: "accept-invite",
      targetType: "PortalUser",
      targetId: portalUser.id,
    });

    return NextResponse.json({ success: true, email: invite.email });
  } catch (error) {
    console.error("[POST /api/portal/auth/accept-invite]", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
