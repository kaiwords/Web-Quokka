import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser, hasPortalRole } from "@/lib/portalAuth";
import { buildStoredFileName, saveDocumentFile, MAX_DOCUMENT_SIZE } from "@/lib/documents";

// POST /api/portal/documents — Manager+: attach a file to one of this
// business's own tickets or change requests. multipart/form-data:
// file, and exactly one of ticketId / changeRequestId.
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionPortalUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!hasPortalRole(sessionUser, "Manager")) {
      return NextResponse.json({ error: "Viewers can't upload attachments" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const ticketIdRaw = formData.get("ticketId");
    const changeRequestIdRaw = formData.get("changeRequestId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 });
    if (file.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json({ error: "File exceeds the 10MB limit" }, { status: 400 });
    }
    if (!ticketIdRaw && !changeRequestIdRaw) {
      return NextResponse.json({ error: "ticketId or changeRequestId is required" }, { status: 400 });
    }

    // Ownership check — the ticket/change request must belong to this business.
    let ticketId: number | undefined;
    let changeRequestId: number | undefined;
    if (ticketIdRaw) {
      // source: "Client" — files must never be attachable to internal staff
      // requests, even ones linked to this business.
      const ticket = await prisma.ticket.findFirst({
        where: { id: parseInt(ticketIdRaw.toString()), clientId: sessionUser.clientId, source: "Client" },
      });
      if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      ticketId = ticket.id;
    }
    if (changeRequestIdRaw) {
      const cr = await prisma.changeRequest.findFirst({ where: { id: parseInt(changeRequestIdRaw.toString()), clientId: sessionUser.clientId } });
      if (!cr) return NextResponse.json({ error: "Change request not found" }, { status: 404 });
      changeRequestId = cr.id;
    }

    const fileName = buildStoredFileName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveDocumentFile(sessionUser.clientId, fileName, buffer);

    const document = await prisma.document.create({
      data: {
        clientId: sessionUser.clientId,
        fileName,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        uploadedBy: sessionUser.name,
        category: "Attachment",
        ticketId,
        changeRequestId,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("[POST /api/portal/documents]", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
