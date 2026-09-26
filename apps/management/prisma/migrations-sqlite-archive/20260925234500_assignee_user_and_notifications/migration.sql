-- Assigning work to a real account, plus the in-app notification inbox.
--
-- Task.assignee / Ticket.assignedTo were free text, so there was nobody to
-- notify. Each gains a nullable FK to User; the old string stays as the
-- display label. Existing names are matched to an account case-insensitively
-- (usernames are stored lowercase, see POST /api/users) and anything with no
-- matching account is simply left unlinked rather than guessed at.

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "assignee" TEXT NOT NULL DEFAULT 'Unassigned',
    "assigneeUserId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Todo',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assignee", "clientId", "createdAt", "dueDate", "id", "status", "title", "updatedAt") SELECT "assignee", "clientId", "createdAt", "dueDate", "id", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE TABLE "new_Ticket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL DEFAULT 'Business',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'New',
    "assignedTo" TEXT NOT NULL DEFAULT 'Unassigned',
    "assignedToUserId" INTEGER,
    "satisfactionRating" INTEGER,
    "resolvedAt" DATETIME,
    "clientId" INTEGER,
    "createdByPortalUserId" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_createdByPortalUserId_fkey" FOREIGN KEY ("createdByPortalUserId") REFERENCES "PortalUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("assignedTo", "category", "clientId", "createdAt", "createdBy", "createdByPortalUserId", "description", "id", "priority", "resolvedAt", "satisfactionRating", "source", "status", "title", "updatedAt") SELECT "assignedTo", "category", "clientId", "createdAt", "createdBy", "createdByPortalUserId", "description", "id", "priority", "resolvedAt", "satisfactionRating", "source", "status", "title", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- Backfill: link assignments that already name a real account.
UPDATE "Task"
   SET "assigneeUserId" = (SELECT "id" FROM "User" WHERE lower("User"."username") = lower("Task"."assignee"))
 WHERE "assignee" IS NOT NULL
   AND "assignee" <> 'Unassigned';

UPDATE "Ticket"
   SET "assignedToUserId" = (SELECT "id" FROM "User" WHERE lower("User"."username") = lower("Ticket"."assignedTo"))
 WHERE "assignedTo" IS NOT NULL
   AND "assignedTo" <> 'Unassigned';

-- Keep the label honest where no account matched: an assignment that cannot
-- be notified reads as Unassigned rather than silently naming a stranger.
UPDATE "Task"   SET "assignee"   = 'Unassigned' WHERE "assigneeUserId"   IS NULL;
UPDATE "Ticket" SET "assignedTo" = 'Unassigned' WHERE "assignedToUserId" IS NULL;
