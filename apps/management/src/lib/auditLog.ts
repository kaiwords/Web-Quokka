import { prisma } from "@/lib/prisma";

// Fire-and-forget audit trail for security-relevant actions (logins,
// approvals, payments, admin changes). No viewer UI yet this phase; query
// via `npx prisma studio` if needed.
//
// Never throws: an audit-write failure must not make a succeeded action
// (e.g. a payment) look failed to the caller.
export async function logAudit(entry: {
  actorType: "Staff" | "Portal";
  actorId: number;
  actorLabel: string;
  action: string;
  targetType: string;
  targetId: number;
}): Promise<void> {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (error) {
    console.error("[auditLog] failed to record", entry.action, error);
  }
}
