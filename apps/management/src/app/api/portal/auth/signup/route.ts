import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";
import { normalizeEmail, escapeHtml } from "@/lib/validate";
import { isRateLimited } from "@/lib/rateLimit";
import { generateToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mailer";
import { logAudit } from "@/lib/auditLog";
import { adminUserIds, notifyMany } from "@/lib/notify";

// POST /api/portal/auth/signup — { name, businessName, email, password }
//
// Public client self-registration. Creates an unvetted business record
// (Client.source="SelfSignup", approvedAt=null) plus its first PortalUser as
// the Owner, in "PendingVerification" until the emailed link is followed.
//
// Three things this deliberately does NOT do:
//  1. It never logs the new user in. A session here would mean an unverified
//     address gets portal access, so anyone could sign up as someone else's
//     business and read whatever a fresh account can see.
//  2. It never says whether an email is already registered. That answer is
//     an account-enumeration oracle; the caller gets the same response
//     either way and the real owner gets told by email instead.
//  3. It grants no access to any EXISTING client's data — a self-signup
//     always gets its own brand-new Client row. Attaching a signup to an
//     established business is a staff action in the CRM, never automatic,
//     or "sign up as Acme Pty Ltd" would be a data breach by design.
const VERIFY_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    if (typeof raw !== "object" || raw === null) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const body = raw as Record<string, unknown>;

    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`portal-signup:ip:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many sign-up attempts. Please try again later." },
        { status: 429 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    const businessName =
      typeof body.businessName === "string" ? body.businessName.trim().slice(0, 200) : "";
    const email = normalizeEmail(body.email);
    const password = body.password;

    if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (!businessName) {
      return NextResponse.json({ error: "Please enter your business name." }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const passwordError = validatePassword(password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

    // Identical response shape for every outcome below — see note 2 above.
    const success = NextResponse.json(
      {
        success: true,
        message: "Check your email for a link to confirm your address.",
      },
      { status: 201 }
    );

    const existing = await prisma.portalUser.findUnique({ where: { email } });
    if (existing) {
      // Tell the real owner of the address, not the person at the keyboard.
      void sendMail({
        to: email,
        subject: "Someone tried to sign up with your WebQuokka email",
        html: `
          <p>Hi ${escapeHtml(existing.name)},</p>
          <p>Someone just tried to create a WebQuokka client portal account using
          this email address, but you already have one.</p>
          <p>If that was you, <a href="${appUrl()}/portal/login">sign in here</a>
          — or <a href="${appUrl()}/portal/forgot-password">reset your password</a>
          if you've forgotten it.</p>
          <p>If it wasn't you, you can safely ignore this email. No account was
          created and nothing has changed.</p>
        `,
      }).catch(() => {});
      return success;
    }

    const passwordHash = hashPassword(password as string);
    const token = generateToken();

    // One transaction: a Client with no Owner, or an Owner with no
    // verification token, would both be accounts nobody can ever use.
    const { portalUser } = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          name: businessName,
          company: businessName,
          contactEmail: email,
          source: "SelfSignup",
          notes: "Self-registered through the website sign-up form.",
        },
      });
      const portalUser = await tx.portalUser.create({
        data: {
          clientId: client.id,
          name,
          email,
          passwordHash,
          // Owner of their own business record — they are its only member
          // until they invite others or staff take over.
          role: "Owner",
          status: "PendingVerification",
        },
      });
      await tx.portalEmailVerification.create({
        data: {
          portalUserId: portalUser.id,
          token,
          expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
        },
      });
      return { client, portalUser };
    });

    void sendMail({
      to: email,
      subject: "Confirm your WebQuokka account",
      html: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thanks for signing up to the WebQuokka client portal. Confirm your
        email address to activate your account:</p>
        <p><a href="${appUrl()}/portal/verify-email?token=${token}">Confirm my email address</a></p>
        <p>This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
      `,
    }).catch(() => {});

    void notifyMany(await adminUserIds(), {
      type: "ClientSignup",
      title: `New client sign-up: ${businessName}`,
      body: `${name} (${email}) registered from the website. Review and approve their business record.`,
      link: "/clients",
    }).catch(() => {});

    await logAudit({
      actorType: "Portal",
      actorId: portalUser.id,
      actorLabel: email,
      action: "signup",
      targetType: "PortalUser",
      targetId: portalUser.id,
    });

    return success;
  } catch (error) {
    console.error("[POST /api/portal/auth/signup]", error);
    return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
  }
}
