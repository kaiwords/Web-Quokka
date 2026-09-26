import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { deleteDocumentFile, readDocumentFile } from "@/lib/documents";
import { logAudit } from "@/lib/auditLog";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/documents/[id] — download the file
export async function GET(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id: parseInt(id) } });
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const buffer = await readDocumentFile(doc.clientId, doc.fileName);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.originalName.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
      "Content-Length": String(doc.size),
    },
  });
}

// DELETE /api/documents/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id: parseInt(id) } });
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await deleteDocumentFile(doc.clientId, doc.fileName);
  await prisma.document.delete({ where: { id: doc.id } });
  // Deleting files (including client-uploaded ticket attachments) leaves a
  // trail — this is destructive and was previously invisible.
  await logAudit({
    actorType: "Staff",
    actorId: sessionUser.id,
    actorLabel: sessionUser.username,
    action: "document-delete",
    targetType: "Document",
    targetId: doc.id,
  });
  return NextResponse.json({ success: true });
}
