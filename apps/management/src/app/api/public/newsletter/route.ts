import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsJson, preflight, resolveOrigin } from "@/lib/cors";
import { normalizeEmail } from "@/lib/validate";
import { isRateLimited } from "@/lib/rateLimit";
import { generateToken } from "@/lib/tokens";
import { clientIp } from "@/lib/publicForms";

// POST /api/public/newsletter — { email } -> subscribe.
//
// Always answers the same way whether the address was new, already
// subscribed, or previously unsubscribed. An endpoint that says "already
// subscribed" is an email-enumeration oracle for anyone with a word list.
export async function POST(req: NextRequest) {
  const origin = resolveOrigin(req);
  try {
    const raw = await req.json();
    if (typeof raw !== "object" || raw === null) {
      return corsJson({ error: "Invalid request." }, { status: 400 }, origin);
    }
    const body = raw as Record<string, unknown>;

    if (typeof body.website === "string" && body.website.trim() !== "") {
      return corsJson({ success: true }, { status: 200 }, origin);
    }

    const ip = clientIp(req);
    if (isRateLimited(`public-newsletter:ip:${ip}`, 10, 10 * 60 * 1000)) {
      return corsJson(
        { error: "Too many attempts. Please try again shortly." },
        { status: 429 },
        origin
      );
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      return corsJson({ error: "Please enter a valid email address." }, { status: 400 }, origin);
    }

    // Resubscribing clears the unsubscribe stamp but keeps the original
    // token, so links in older emails keep working.
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { status: "Subscribed", unsubscribedAt: null },
      create: { email, unsubscribeToken: generateToken(), ipAddress: ip },
    });

    return corsJson({ success: true }, { status: 201 }, origin);
  } catch (error) {
    console.error("[POST /api/public/newsletter]", error);
    return corsJson({ error: "Could not subscribe. Please try again." }, { status: 500 }, origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(req);
}
