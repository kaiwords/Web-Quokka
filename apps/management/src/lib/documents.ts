import { randomUUID } from "crypto";

// Files live in a private Supabase Storage bucket (created by the
// 20260927000000_documents_bucket migration), never on local disk: Vercel's
// filesystem is read-only and not shared between requests. The bucket is not
// public, so files are only reachable through the authenticated
// /api/documents/[id] routes, which fetch them here with the service role key.
const BUCKET = "documents";
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_").slice(0, 150);
}

export function buildStoredFileName(originalName: string): string {
  return `${randomUUID()}-${sanitizeName(originalName)}`;
}

function storage(pathAndQuery: string, init: RequestInit = {}): Promise<Response> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Document storage needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  return fetch(`${url.replace(/\/$/, "")}/storage/v1${pathAndQuery}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, apikey: key, ...init.headers },
    cache: "no-store",
  });
}

async function ensureOk(res: Response, action: string): Promise<Response> {
  if (!res.ok) throw new Error(`Document storage ${action} failed: ${res.status} ${await res.text()}`);
  return res;
}

function objectPath(clientId: number, fileName: string): string {
  return `${clientId}/${encodeURIComponent(fileName)}`;
}

async function removeObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await ensureOk(
    await storage(`/object/${BUCKET}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: paths }),
    }),
    "delete",
  );
}

export async function saveDocumentFile(clientId: number, fileName: string, buffer: Buffer): Promise<void> {
  await ensureOk(
    await storage(`/object/${BUCKET}/${objectPath(clientId, fileName)}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array(buffer),
    }),
    "upload",
  );
}

export async function readDocumentFile(clientId: number, fileName: string): Promise<Buffer> {
  const res = await ensureOk(
    await storage(`/object/authenticated/${BUCKET}/${objectPath(clientId, fileName)}`),
    "download",
  );
  return Buffer.from(await res.arrayBuffer());
}

export async function deleteDocumentFile(clientId: number, fileName: string): Promise<void> {
  try {
    await removeObjects([`${clientId}/${fileName}`]);
  } catch {
    // already gone from storage — the DB row is still the source of truth to delete
  }
}

// Removes every file stored for a client. Called after the client row is
// deleted (which cascades its Document rows), so a deleted business's
// uploads don't linger in storage with nothing pointing at them.
export async function deleteClientFiles(clientId: number): Promise<void> {
  try {
    await deleteClientFolder(clientId);
  } catch (err) {
    // The client row is already gone; orphaned files must not turn that into a failed request.
    console.error(`Could not remove stored files for client ${clientId}:`, err);
  }
}

async function deleteClientFolder(clientId: number): Promise<void> {
  // Storage has no folder delete: list the client's objects page by page and
  // remove them. Each pass deletes what it listed, so always read offset 0.
  for (;;) {
    const res = await ensureOk(
      await storage(`/object/list/${BUCKET}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: `${clientId}/`, limit: 1000, offset: 0 }),
      }),
      "list",
    );
    const items: { name: string }[] = await res.json();
    if (items.length === 0) return;
    await removeObjects(items.map((item) => `${clientId}/${item.name}`));
  }
}
