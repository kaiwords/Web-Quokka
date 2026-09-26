import { NextRequest } from "next/server";
import { corsJson, preflight, resolveOrigin } from "@/lib/cors";
import { handleEnquiry } from "@/lib/publicForms";

// POST /api/public/contact — the marketing site's contact form.
// Public and unauthenticated; see src/lib/publicForms.ts for the validation,
// honeypot and rate limiting that stands in for a login here.
export async function POST(req: NextRequest) {
  const origin = resolveOrigin(req);
  try {
    const raw = await req.json();
    if (typeof raw !== "object" || raw === null) {
      return corsJson({ error: "Invalid request." }, { status: 400 }, origin);
    }
    const result = await handleEnquiry(req, "Contact", raw as Record<string, unknown>);
    return corsJson(result.body, { status: result.status }, origin);
  } catch (error) {
    console.error("[POST /api/public/contact]", error);
    return corsJson(
      { error: "Could not send your message. Please try again." },
      { status: 500 },
      origin
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(req);
}
