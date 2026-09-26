import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isTaskOpen, type TaskStatus } from "@/types";
import type { Prisma } from "@prisma/client";

// GET /api/clients — list clients, optionally filtered by search text,
// grouped into "working on" vs "worked with", or drilled into from a
// dashboard stat card.
// Query params:
//   ?q=search-text
//   ?group=workingon|workedwith
//   ?stage=<ClientStage>          — exact stage, overrides `group`
//   ?payment=outstanding          — paymentStatus != Paid
//   ?mvp=pending                  — MVP sent but not yet client-approved
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const group = searchParams.get("group");
    const stage = searchParams.get("stage");
    const payment = searchParams.get("payment");
    const mvp = searchParams.get("mvp");

    const where: Prisma.ClientWhereInput = {};

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { company: { contains: q } },
        { contactEmail: { contains: q } },
      ];
    }

    if (stage) {
      where.stage = stage;
    } else if (group === "workingon") {
      where.stage = { not: "Completed" };
    } else if (group === "workedwith") {
      where.stage = "Completed";
    }

    if (payment === "outstanding") {
      where.paymentStatus = { not: "Paid" };
    }

    if (mvp === "pending") {
      where.mvpSentAt = { not: null };
      where.mvpApprovedAt = null;
    }

    const clients = await prisma.client.findMany({
      where,
      include: { tasks: { select: { status: true } }, requirements: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
    });

    const summaries = clients.map(({ tasks, requirements, ...client }) => ({
      ...client,
      requirementCount: requirements.length,
      taskCount: tasks.length,
      openTaskCount: tasks.filter((t) => isTaskOpen(t.status as TaskStatus)).length,
    }));

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("[GET /api/clients]", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

// POST /api/clients — onboard a new client (admin only)
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, company, contactEmail, contactPhone } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        name,
        company: company || "",
        contactEmail: contactEmail || "",
        contactPhone: contactPhone || "",
        // An admin typing a client in IS the vetting step, so this is
        // approved on creation. Only self-signups arrive unapproved.
        source: "Staff",
        approvedAt: new Date(),
        approvedBy: sessionUser.username,
      },
      include: { requirements: true, tasks: true },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clients]", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
