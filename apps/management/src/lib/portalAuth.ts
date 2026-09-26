import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Mirrors src/lib/auth.ts exactly, but on a fully separate table/cookie —
// a staff session must never grant portal access, or vice versa.
export const PORTAL_SESSION_COOKIE = "wq_portal_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type PortalRole = "Owner" | "Manager" | "Viewer";
const ROLE_RANK: Record<PortalRole, number> = { Viewer: 0, Manager: 1, Owner: 2 };

export interface SafePortalUser {
  id: number;
  clientId: number;
  name: string;
  email: string;
  role: PortalRole;
}

export async function createPortalSession(portalUserId: number): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await prisma.portalSession.create({ data: { portalUserId, expiresAt } });
  return { token: session.id, expiresAt };
}

export async function destroyPortalSessionToken(token: string): Promise<void> {
  await prisma.portalSession.deleteMany({ where: { id: token } });
}

export async function destroyAllPortalSessions(portalUserId: number): Promise<void> {
  await prisma.portalSession.deleteMany({ where: { portalUserId } });
}

export async function getPortalUserByToken(token: string | undefined): Promise<SafePortalUser | null> {
  if (!token) return null;
  const session = await prisma.portalSession.findUnique({ where: { id: token }, include: { portalUser: true } });
  if (!session || session.expiresAt < new Date()) return null;
  if (session.portalUser.status === "Disabled") return null;
  return {
    id: session.portalUser.id,
    clientId: session.portalUser.clientId,
    name: session.portalUser.name,
    email: session.portalUser.email,
    role: session.portalUser.role as PortalRole,
  };
}

// Reads the portal session cookie for the current request — use from Route Handlers.
export async function getSessionPortalUser(): Promise<SafePortalUser | null> {
  const store = await cookies();
  return getPortalUserByToken(store.get(PORTAL_SESSION_COOKIE)?.value);
}

// Viewer < Manager < Owner. Every mutating portal route should gate on this.
export function hasPortalRole(user: SafePortalUser, minRole: PortalRole): boolean {
  return ROLE_RANK[user.role] >= ROLE_RANK[minRole];
}
