-- Replace Task.done + Task.approval with a single work status.
-- Tasks are admin-assigned and never approved, so the old approval column
-- is dropped outright; `done` carries over as Done vs Todo.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "assignee" TEXT NOT NULL DEFAULT 'Unassigned',
    "status" TEXT NOT NULL DEFAULT 'Todo',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Task" ("id", "clientId", "title", "assignee", "status", "dueDate", "createdAt", "updatedAt")
SELECT "id", "clientId", "title", "assignee",
       CASE WHEN "done" = 1 THEN 'Done' ELSE 'Todo' END,
       "dueDate", "createdAt", "updatedAt"
FROM "Task";

DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";

PRAGMA foreign_keys=ON;
