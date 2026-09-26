import { mkdir, readFile, rm, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Files live outside `public/` so they're never directly web-accessible —
// only served through the authenticated /api/documents/[id] route.
const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_").slice(0, 150);
}

export function buildStoredFileName(originalName: string): string {
  return `${randomUUID()}-${sanitizeName(originalName)}`;
}

function clientDir(clientId: number): string {
  return path.join(STORAGE_ROOT, String(clientId));
}

export async function saveDocumentFile(clientId: number, fileName: string, buffer: Buffer): Promise<void> {
  const dir = clientDir(clientId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);
}

export async function readDocumentFile(clientId: number, fileName: string): Promise<Buffer> {
  return readFile(path.join(clientDir(clientId), fileName));
}

export async function deleteDocumentFile(clientId: number, fileName: string): Promise<void> {
  try {
    await unlink(path.join(clientDir(clientId), fileName));
  } catch {
    // already gone on disk — the DB row is still the source of truth to delete
  }
}

// Removes every file stored for a client. Called after the client row is
// deleted (which cascades its Document rows), so a deleted business's
// uploads don't linger on disk with nothing pointing at them.
export async function deleteClientFiles(clientId: number): Promise<void> {
  await rm(clientDir(clientId), { recursive: true, force: true });
}
