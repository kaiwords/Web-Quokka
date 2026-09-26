import { NextResponse } from "next/server";
import { getSessionPortalUser } from "@/lib/portalAuth";

// GET /api/portal/auth/me — the currently logged-in portal user, or 401
export async function GET() {
  const user = await getSessionPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return NextResponse.json(user);
}
