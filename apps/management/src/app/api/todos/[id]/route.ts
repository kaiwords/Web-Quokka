import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/todos/[id] — toggle done or edit title. Only the owner may touch it.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { id } = await params;
    const todo = await prisma.todo.findUnique({ where: { id: parseInt(id) } });
    if (!todo || todo.userId !== sessionUser.id) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    // Whitelist fields — spreading the raw body into prisma.update allows
    // nested relation writes (e.g. {"user":{"update":{"isAdmin":true}}}).
    const body = await req.json();
    const data: { title?: string; done?: boolean } = {};
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 500);
    if (typeof body.done === "boolean") data.done = body.done;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.todo.update({ where: { id: todo.id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/todos/[id]]", error);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

// DELETE /api/todos/[id] — only the owner may delete it.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const todo = await prisma.todo.findUnique({ where: { id: parseInt(id) } });
  if (!todo || todo.userId !== sessionUser.id) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  await prisma.todo.delete({ where: { id: todo.id } });
  return NextResponse.json({ success: true });
}
