import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserByToken, SESSION_COOKIE } from "@/lib/auth";
import { getPortalUserByToken, PORTAL_SESSION_COOKIE } from "@/lib/portalAuth";

// Paths reachable without a session.
// "/unsubscribe" is reached from a link in a newsletter email, so the reader is
// not signed in to anything — without it here the proxy would send people
// trying to unsubscribe to a staff login screen.
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/unsubscribe"];

// Everything under /api/public/ is unauthenticated by definition — it is what
// the marketing site (apps/web) posts its contact, quote and newsletter forms
// to from another origin. Matched as a prefix, not an exact list, so a new
// public form endpoint cannot be added and then silently answer 401. Those
// routes do their own validation, rate limiting and CORS
// (src/lib/publicForms.ts, src/lib/cors.ts).
const PUBLIC_API_PREFIX = "/api/public/";

// Portal (client-facing) paths are a fully separate trust boundary from the
// staff CRM above — own cookie, own public allowlist, own user lookup.
const PUBLIC_PORTAL_PATHS = [
  "/portal/login",
  "/portal/signup",
  "/portal/accept-invite",
  "/portal/forgot-password",
  "/portal/reset-password",
  // Reached from an emailed link, so by definition nobody is signed in yet.
  "/portal/verify-email",
  "/portal/resend-verification",
  "/api/portal/auth/login",
  "/api/portal/auth/signup",
  "/api/portal/auth/accept-invite",
  "/api/portal/auth/forgot-password",
  "/api/portal/auth/reset-password",
  "/api/portal/auth/verify-email",
  "/api/portal/auth/resend-verification",
];

function isPortalPath(pathname: string): boolean {
  return pathname === "/portal" || pathname.startsWith("/portal/") || pathname.startsWith("/api/portal/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Checked before anything else: these are not portal paths, so without this
  // they would fall through to the staff branch below and answer 401.
  if (pathname.startsWith(PUBLIC_API_PREFIX)) {
    return NextResponse.next();
  }

  if (isPortalPath(pathname)) {
    if (PUBLIC_PORTAL_PATHS.includes(pathname)) {
      return NextResponse.next();
    }

    const token = request.cookies.get(PORTAL_SESSION_COOKIE)?.value;
    const portalUser = await getPortalUserByToken(token);

    if (!portalUser) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
      }
      const loginUrl = new URL("/portal/login", request.url);
      // Keep the query string so "?next=/portal/invoices?status=Unpaid"
      // round-trips through login intact.
      loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/portal/team") && portalUser.role !== "Owner") {
      return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getUserByToken(token);

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname.startsWith("/admin") || pathname.startsWith("/client-tickets")) && !user.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
