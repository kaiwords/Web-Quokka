import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "wq_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface SafeUser {
  id: number;
  username: string;
  role: string;
  isAdmin: boolean;
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await prisma.session.create({ data: { userId, expiresAt } });
  return { token: session.id, expiresAt };
}

export async function destroySessionToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: token } });
}

export async function getUserByToken(token: string | undefined): Promise<SafeUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { id: token }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
    isAdmin: session.user.isAdmin,
  };
}

// Reads the session cookie for the current request — use from Route Handlers.
export async function getSessionUser(): Promise<SafeUser | null> {
  const store = await cookies();
  return getUserByToken(store.get(SESSION_COOKIE)?.value);
}
