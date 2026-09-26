-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT 'Onboarding',
    "paymentStatus" TEXT NOT NULL DEFAULT 'NotPaid',
    "amountPaid" TEXT NOT NULL DEFAULT '0',
    "totalAmount" TEXT NOT NULL DEFAULT '0',
    "mvpSentAt" DATETIME,
    "mvpApprovedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "functionality" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Must',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Requirement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "assignee" TEXT NOT NULL DEFAULT 'Unassigned',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "approval" TEXT NOT NULL DEFAULT 'Draft',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
