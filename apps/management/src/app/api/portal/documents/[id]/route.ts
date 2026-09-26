import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser } from "@/lib/portalAuth";
import { readDocumentFile } from "@/lib/documents";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/portal/documents/[id] — download a file, only if it belongs to
// the caller's own business (unlike the staff /api/documents/[id] route,
// which any staff member may access — this is the tenant isolation boundary).
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findFirst({ where: { id: parseInt(id), clientId: sessionUser.clientId } });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const buffer = await readDocumentFile(doc.clientId, doc.fileName);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.originalName.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
      "Content-Length": String(doc.size),
    },
  });
}
