import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroyPortalSessionToken, PORTAL_SESSION_COOKIE } from "@/lib/portalAuth";

// POST /api/portal/auth/logout — clears the portal session cookie and revokes it server-side
export async function POST() {
  const store = await cookies();
  const token = store.get(PORTAL_SESSION_COOKIE)?.value;
  if (token) await destroyPortalSessionToken(token);
  store.delete(PORTAL_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
