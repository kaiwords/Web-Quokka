import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isOneOf, parseId } from "@/lib/validate";
import { logAudit } from "@/lib/auditLog";
import { ENQUIRY_STATUSES } from "@/types";

// PATCH /api/enquiries/[id] — { status } | { convert: true }
//
// `convert` turns a qualified enquiry into a real Client record. That is an
// explicit staff action: the CRM's counts and pipeline stages only mean
// something if a stranger who filled in a form isn't already counted as a client.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const enquiry = await prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });

    const body = await req.json();

    if (body.convert === true) {
      if (enquiry.convertedClientId !== null) {
        return NextResponse.json(
          { error: "This enquiry has already been converted." },
          { status: 409 }
        );
      }
      const client = await prisma.$transaction(async (tx) => {
        const created = await tx.client.create({
          data: {
            name: enquiry.business || enquiry.name,
            company: enquiry.business,
            contactEmail: enquiry.email,
            contactPhone: enquiry.phone,
            notes: [
              `Converted from website ${enquiry.type.toLowerCase()} enquiry #${enquiry.id}.`,
              enquiry.service && `Service: ${enquiry.service}`,
              enquiry.budget && `Budget: ${enquiry.budget}`,
              enquiry.message,
            ]
              .filter(Boolean)
              .join("\n"),
            // Staff-vetted by definition — a human is converting it right now.
            source: "Staff",
            approvedAt: new Date(),
            approvedBy: sessionUser.username,
          },
        });
        await tx.enquiry.update({
          where: { id },
          data: { status: "Converted", convertedClientId: created.id },
        });
        return created;
      });

      await logAudit({
        actorType: "Staff",
        actorId: sessionUser.id,
        actorLabel: sessionUser.username,
        action: "convert-enquiry",
        targetType: "Enquiry",
        targetId: id,
      });

      return NextResponse.json({ success: true, clientId: client.id });
    }

    if (!isOneOf(body.status, ENQUIRY_STATUSES)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const updated = await prisma.enquiry.update({ where: { id }, data: { status: body.status } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/enquiries/[id]]", error);
    return NextResponse.json({ error: "Failed to update enquiry" }, { status: 500 });
  }
}

// DELETE /api/enquiries/[id] — admin only. Spam gets deleted, not archived.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (!sessionUser.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await prisma.enquiry.delete({ where: { id } });
    await logAudit({
      actorType: "Staff",
      actorId: sessionUser.id,
      actorLabel: sessionUser.username,
      action: "delete-enquiry",
      targetType: "Enquiry",
      targetId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/enquiries/[id]]", error);
    return NextResponse.json({ error: "Failed to delete enquiry" }, { status: 500 });
  }
}
