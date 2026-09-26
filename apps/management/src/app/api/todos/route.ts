import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET /api/todos — the logged-in user's own personal to-do list
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const todos = await prisma.todo.findMany({
    where: { userId: sessionUser.id },
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(todos);
}

// POST /api/todos — add a personal to-do (any logged-in user)
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { title } = await req.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const todo = await prisma.todo.create({
      data: { userId: sessionUser.id, title: title.trim() },
    });
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("[POST /api/todos]", error);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
