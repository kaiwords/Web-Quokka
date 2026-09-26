import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { buildStoredFileName, saveDocumentFile, MAX_DOCUMENT_SIZE } from "@/lib/documents";

// POST /api/documents — upload a document during requirements gathering.
// multipart/form-data: clientId, file. Any logged-in user may upload.
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const formData = await req.formData();
    const clientIdRaw = formData.get("clientId");
    const file = formData.get("file");

    if (!clientIdRaw || !(file instanceof File)) {
      return NextResponse.json({ error: "clientId and file are required" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json({ error: "File exceeds the 10MB limit" }, { status: 400 });
    }

    const clientId = parseInt(clientIdRaw.toString());
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const fileName = buildStoredFileName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveDocumentFile(clientId, fileName, buffer);

    const document = await prisma.document.create({
      data: {
        clientId,
        fileName,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        uploadedBy: sessionUser.username,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("[POST /api/documents]", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
