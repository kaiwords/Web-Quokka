import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { CLIENT_STAGES, OPEN_TASK_STATUSES } from "@/types";

// GET /api/dashboard/stats — aggregated KPI data for the dashboard
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const [clients, openTaskCount, tasksDoneCount, tasksCancelledCount, mvpPendingApprovalCount] = await Promise.all([
      prisma.client.findMany({ select: { stage: true, paymentStatus: true } }),
      prisma.task.count({ where: { status: { in: OPEN_TASK_STATUSES } } }),
      prisma.task.count({ where: { status: "Done" } }),
      prisma.task.count({ where: { status: "Cancelled" } }),
      prisma.client.count({
        where: { mvpSentAt: { not: null }, mvpApprovedAt: null },
      }),
    ]);

    const workingOnCount = clients.filter((c) => c.stage !== "Completed").length;
    const workedWithCount = clients.length - workingOnCount;
    const paymentOutstandingCount = clients.filter(
      (c) => c.paymentStatus !== "Paid"
    ).length;

    const stageBreakdown = CLIENT_STAGES.map((stage) => ({
      stage,
      count: clients.filter((c) => c.stage === stage).length,
    }));

    return NextResponse.json({
      totalClients: clients.length,
      workingOnCount,
      workedWithCount,
      openTaskCount,
      tasksDoneCount,
      // Cancelled work is left out of the total so the progress bar reads
      // "done out of what's still meant to happen".
      tasksTotalCount: openTaskCount + tasksDoneCount,
      tasksCancelledCount,
      paymentOutstandingCount,
      mvpPendingApprovalCount,
      stageBreakdown,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
