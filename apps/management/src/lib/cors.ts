import { NextRequest, NextResponse } from "next/server";

// The marketing site (apps/web) is deployed to its own origin, so its form
// posts are cross-origin and need CORS. Nothing else does: the login and
// sign-up pages are served BY this app, so every cookie-bearing request is
// same-origin. That is deliberate — it keeps session cookies out of any
// cross-origin exchange, which is why none of the helpers below ever send
// `Access-Control-Allow-Credentials`.
//
// Origins come from PUBLIC_SITE_ORIGINS (comma-separated, exact origins, no
// trailing slash), e.g.
//   PUBLIC_SITE_ORIGINS="https://webquokka.com.au,https://www.webquokka.com.au"
// In development, localhost Vite ports are allowed automatically.
const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
];

function allowedOrigins(): string[] {
  const configured = (process.env.PUBLIC_SITE_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return process.env.NODE_ENV === "production" ? configured : [...configured, ...DEV_ORIGINS];
}

/** The request's Origin if we allow it, else null. */
export function resolveOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  return allowedOrigins().includes(origin.replace(/\/$/, "")) ? origin : null;
}

/** Echo the allowed origin onto a response. Vary: Origin matters — without it
 *  a CDN can cache one site's CORS headers and serve them to another. */
export function withCors(res: NextResponse, origin: string | null): NextResponse {
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
  }
  return res;
}

export function corsJson(
  body: unknown,
  init: { status?: number },
  origin: string | null
): NextResponse {
  return withCors(NextResponse.json(body, init), origin);
}

/** Shared OPTIONS preflight handler for the public routes. */
export function preflight(req: NextRequest): NextResponse {
  const origin = resolveOrigin(req);
  const res = new NextResponse(null, { status: origin ? 204 : 403 });
  if (origin) {
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    res.headers.set("Access-Control-Max-Age", "86400");
  }
  return withCors(res, origin);
}
