import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/types";

// In-app notification inbox (the bell in the top bar). Same contract as
// logAudit: fire-and-forget and never throws — failing to tell someone
// about a task must not make assigning the task look like it failed.
//
// Delivery is deliberately behind this one function rather than inlined at
// the call sites, so adding a second channel later (email, once User has an
// address and RESEND_API_KEY is set) is a change here and nowhere else.

export interface NotifyInput {
  /** Staff user to notify. */
  userId: number;
  type: NotificationType;
  title: string;
  body?: string;
  /** In-app href the bell opens on click. */
  link?: string;
  /** Who caused this. Self-triggered events are skipped — no point telling
   *  someone what they just did themselves. */
  actorUserId?: number | null;
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    if (input.actorUserId != null && input.actorUserId === input.userId) return;
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title.slice(0, 300),
        body: (input.body ?? "").slice(0, 2000),
        link: input.link ?? "",
      },
    });
  } catch (error) {
    console.error("[notify] failed to record", input.type, error);
  }
}

// Fan-out helper for the events that concern a group rather than one
// assignee (a new change request, an invoice getting paid). De-duplicates
// ids so a user listed twice is not told twice.
export async function notifyMany(
  userIds: number[],
  input: Omit<NotifyInput, "userId">
): Promise<void> {
  const unique = [...new Set(userIds)].filter((id) => Number.isInteger(id));
  await Promise.all(unique.map((userId) => notify({ ...input, userId })));
}

// The admin audience for client-originated events that aren't assigned to
// anyone in particular. Returns ids only — callers pass it to notifyMany.
export async function adminUserIds(): Promise<number[]> {
  try {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  } catch (error) {
    console.error("[notify] failed to load admin audience", error);
    return [];
  }
}

// Some records (Suggestion.createdBy, ProjectUpdate.postedBy) store a
// username string rather than a FK. Resolve it to an account so the author
// can still be notified; returns null when the name matches no account,
// which callers treat as "fall back to the admins".
export async function userIdByUsername(name: string | null | undefined): Promise<number | null> {
  if (!name || !name.trim()) return null;
  try {
    const user = await prisma.user.findFirst({
      where: { username: name.trim().toLowerCase() },
      select: { id: true },
    });
    return user?.id ?? null;
  } catch (error) {
    console.error("[notify] failed to resolve username", name, error);
    return null;
  }
}

// Notify the named author, or every admin when the name matches no account.
// The common shape for client-originated events that staff must not miss.
export async function notifyAuthorOrAdmins(
  authorUsername: string | null | undefined,
  input: Omit<NotifyInput, "userId">
): Promise<void> {
  const authorId = await userIdByUsername(authorUsername);
  if (authorId !== null) {
    await notify({ ...input, userId: authorId });
    return;
  }
  await notifyMany(await adminUserIds(), input);
}
