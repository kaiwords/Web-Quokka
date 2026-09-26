-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChangeRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "pageSection" TEXT NOT NULL DEFAULT '',
    "referenceLinks" TEXT NOT NULL DEFAULT '',
    "desiredDeadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "includedInPlan" BOOLEAN NOT NULL DEFAULT false,
    "quoteAmount" TEXT NOT NULL DEFAULT '',
    "quoteEstimatedTime" TEXT NOT NULL DEFAULT '',
    "createdByPortalUserId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChangeRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChangeRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChangeRequest_createdByPortalUserId_fkey" FOREIGN KEY ("createdByPortalUserId") REFERENCES "PortalUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ChangeRequest" ("clientId", "createdAt", "createdByPortalUserId", "description", "desiredDeadline", "id", "includedInPlan", "pageSection", "projectId", "quoteAmount", "quoteEstimatedTime", "referenceLinks", "status", "title", "updatedAt") SELECT "clientId", "createdAt", "createdByPortalUserId", "description", "desiredDeadline", "id", "includedInPlan", "pageSection", "projectId", "quoteAmount", "quoteEstimatedTime", "referenceLinks", "status", "title", "updatedAt" FROM "ChangeRequest";
DROP TABLE "ChangeRequest";
ALTER TABLE "new_ChangeRequest" RENAME TO "ChangeRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
