import { NextResponse } from "next/server";
import {
  deleteLesson,
  listLessons,
  seedDemoIfEmpty,
  upsertLesson,
  type JournalLesson,
} from "@/lib/db";
import { uid } from "@/lib/utils";
import { requireAuth, requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — any authenticated user (a student of that grade should see their own
// schedule). POST/DELETE are teacher-only.
export async function GET(req: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  seedDemoIfEmpty();
  const { searchParams } = new URL(req.url);
  const grade = Number(searchParams.get("grade") || 5);
  const lessons = listLessons(grade);
  return NextResponse.json({ lessons });
}

export async function POST(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
  const body = (await req.json()) as Partial<JournalLesson>;
  if (!body.grade || !body.date || !body.topic) {
    return NextResponse.json({ error: "grade, date, topic required" }, { status: 400 });
  }
  const lesson: JournalLesson = {
    id: body.id || uid("lesson"),
    grade: Number(body.grade),
    date: body.date,
    topic: body.topic,
    module: Number(body.module || 1),
    createdAt: body.createdAt || new Date().toISOString(),
  };
  upsertLesson(lesson);
  return NextResponse.json({ lesson });
}

export async function DELETE(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteLesson(id);
  return NextResponse.json({ ok: true });
}
