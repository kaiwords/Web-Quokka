import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isOneOf } from "@/lib/validate";
import { ENQUIRY_STATUSES } from "@/types";

// GET /api/enquiries — submissions from the public website's contact and
// quote forms. Any logged-in staff user can view. Optional ?status= filter.
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const status = new URL(req.url).searchParams.get("status");
  const enquiries = await prisma.enquiry.findMany({
    where: isOneOf(status, ENQUIRY_STATUSES) ? { status } : {},
    orderBy: { createdAt: "desc" },
    // ipAddress is abuse-triage data, not something the CRM list needs.
    select: {
      id: true,
      type: true,
      name: true,
      business: true,
      email: true,
      phone: true,
      service: true,
      budget: true,
      message: true,
      status: true,
      convertedClientId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(enquiries);
}
