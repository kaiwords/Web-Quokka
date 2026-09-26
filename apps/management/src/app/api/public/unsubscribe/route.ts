import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsJson, preflight, resolveOrigin } from "@/lib/cors";
import { isRateLimited } from "@/lib/rateLimit";
import { clientIp } from "@/lib/publicForms";

const INVALID = "This unsubscribe link is not valid.";

// GET /api/public/unsubscribe?token=... — look up who a link belongs to so the
// page can show the address before acting. Read-only on purpose: see the POST.
export async function GET(req: NextRequest) {
  const origin = resolveOrigin(req);
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return corsJson({ error: INVALID }, { status: 400 }, origin);

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
    select: { email: true, status: true },
  });
  if (!subscriber) return corsJson({ error: INVALID }, { status: 400 }, origin);

  return corsJson(
    { email: subscriber.email, alreadyUnsubscribed: subscriber.status === "Unsubscribed" },
    {},
    origin
  );
}

// POST /api/public/unsubscribe — { token } -> unsubscribe.
//
// The state change is a POST rather than the emailed GET because mail scanners
// and link previewers follow GETs, which would unsubscribe people who never
// clicked anything. The emailed link opens a page that posts this.
//
// Idempotent: unsubscribing twice succeeds. The token is never consumed, so an
// old email's link keeps working, and it is deliberately NOT a way to discover
// an address — 64 hex characters is not guessable.
export async function POST(req: NextRequest) {
  const origin = resolveOrigin(req);
  try {
    const { token } = await req.json();
    if (typeof token !== "string" || !token) {
      return corsJson({ error: INVALID }, { status: 400 }, origin);
    }

    if (isRateLimited(`public-unsubscribe:ip:${clientIp(req)}`, 20, 10 * 60 * 1000)) {
      return corsJson({ error: "Too many attempts. Try again shortly." }, { status: 429 }, origin);
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });
    if (!subscriber) return corsJson({ error: INVALID }, { status: 400 }, origin);

    if (subscriber.status !== "Unsubscribed") {
      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: { status: "Unsubscribed", unsubscribedAt: new Date() },
      });
    }

    return corsJson({ success: true, email: subscriber.email }, {}, origin);
  } catch (error) {
    console.error("[POST /api/public/unsubscribe]", error);
    return corsJson({ error: "Could not unsubscribe. Please try again." }, { status: 500 }, origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(req);
}
