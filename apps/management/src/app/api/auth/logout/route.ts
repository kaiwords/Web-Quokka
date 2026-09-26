import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySessionToken, SESSION_COOKIE } from "@/lib/auth";

// POST /api/auth/logout — clears the session cookie and revokes it server-side
export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await destroySessionToken(token);
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
