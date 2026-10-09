import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/auditLog";
import {
  buildStoredFileName,
  deleteDocumentFile,
  saveDocumentFile,
  MAX_DOCUMENT_SIZE,
} from "@/lib/documents";

interface Params {
  params: Promise<{ id: string }>;
}

// The uploaded file replaces the generated PDF everywhere the invoice is
// downloaded (staff and portal), so it is admin-only like every other
// invoice mutation, and PDF-only so "INV-0012.pdf" is always actually a PDF.

// POST /api/invoices/[id]/file — admin only: attach an uploaded invoice PDF
// (multipart/form-data: file). Replaces any previously uploaded one, so an
// invoice never has two competing files.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const invoiceId = parseInt(id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { documents: true },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json({ error: "File exceeds the 10MB limit" }, { status: 400 });
    }
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      return NextResponse.json({ error: "Invoices must be uploaded as PDF" }, { status: 400 });
    }

    const fileName = buildStoredFileName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveDocumentFile(invoice.clientId, fileName, buffer);

    // Swap in the new file: create the row, then drop the old row(s) and
    // their stored objects. Storage cleanup is best-effort (deleteDocumentFile
    // already swallows already-gone objects).
    const document = await prisma.document.create({
      data: {
        clientId: invoice.clientId,
        invoiceId,
        fileName,
        originalName: file.name,
        mimeType: "application/pdf",
        size: file.size,
        uploadedBy: sessionUser.username,
        category: "Invoice",
      },
    });
    for (const old of invoice.documents) {
      await prisma.document.delete({ where: { id: old.id } }).catch(() => {});
      await deleteDocumentFile(invoice.clientId, old.fileName);
    }

    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: "upload-invoice-file",
      targetType: "Invoice",
      targetId: invoiceId,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("[POST /api/invoices/[id]/file]", error);
    return NextResponse.json({ error: "Failed to upload invoice file" }, { status: 500 });
  }
}

// DELETE /api/invoices/[id]/file — admin only: remove the uploaded PDF; the
// invoice's downloads fall back to the generated document.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const invoiceId = parseInt(id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { documents: true },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    for (const doc of invoice.documents) {
      await prisma.document.delete({ where: { id: doc.id } }).catch(() => {});
      await deleteDocumentFile(invoice.clientId, doc.fileName);
    }

    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: "remove-invoice-file",
      targetType: "Invoice",
      targetId: invoiceId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/invoices/[id]/file]", error);
    return NextResponse.json({ error: "Failed to remove invoice file" }, { status: 500 });
  }
}
