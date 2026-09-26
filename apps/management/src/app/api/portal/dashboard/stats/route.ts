import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPortalUser } from "@/lib/portalAuth";

// GET /api/portal/dashboard/stats — at-a-glance cards + recent activity for
// this business.
export async function GET() {
  const sessionUser = await getSessionPortalUser();
  if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const clientId = sessionUser.clientId;

  const [
    projects,
    openTicketCount,
    openChangeRequestCount,
    unpaidInvoices,
    newSuggestionCount,
    recentTickets,
    recentChangeRequests,
    recentUpdates,
    recentSuggestions,
  ] = await Promise.all([
    prisma.project.findMany({ where: { clientId }, include: { milestones: { select: { status: true } } } }),
    prisma.ticket.count({ where: { clientId, source: "Client", status: { in: ["Open", "InProgress", "WaitingOnClient"] } } }),
    prisma.changeRequest.count({ where: { clientId, status: { in: ["Submitted", "UnderReview", "QuoteSent", "InProgress"] } } }),
    prisma.invoice.findMany({ where: { clientId, status: { in: ["Unpaid", "Overdue"] } }, select: { totalAmount: true } }),
    prisma.suggestion.count({ where: { clientId, status: "Proposed" } }),
    prisma.ticket.findMany({ where: { clientId, source: "Client" }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.changeRequest.findMany({ where: { clientId }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.projectUpdate.findMany({ where: { project: { clientId } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.suggestion.findMany({ where: { clientId }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  const activeProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    progress:
      p.milestones.length === 0 ? 0 : Math.round((p.milestones.filter((m) => m.status === "Completed").length / p.milestones.length) * 100),
  }));

  const unpaidInvoiceTotal = unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);

  const activity = [
    ...recentTickets.map((t) => ({ type: "ticket" as const, id: t.id, title: t.title, status: t.status, at: t.updatedAt })),
    ...recentChangeRequests.map((c) => ({ type: "changeRequest" as const, id: c.id, title: c.title, status: c.status, at: c.updatedAt })),
    ...recentUpdates.map((u) => ({ type: "projectUpdate" as const, id: u.id, title: u.body.slice(0, 80), projectId: u.projectId, at: u.createdAt })),
    ...recentSuggestions.map((s) => ({ type: "suggestion" as const, id: s.id, title: s.title, status: s.status, at: s.updatedAt })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return NextResponse.json({
    activeProjects,
    openTicketCount,
    openChangeRequestCount,
    unpaidInvoiceCount: unpaidInvoices.length,
    unpaidInvoiceTotal: unpaidInvoiceTotal.toFixed(2),
    newSuggestionCount,
    recentActivity: activity,
  });
}
