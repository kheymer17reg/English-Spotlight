import { NextResponse } from "next/server";
import {
  entriesForStudent,
  listEntries,
  listLessons,
  seedDemoIfEmpty,
  upsertEntry,
  type Attendance,
  type JournalEntry,
} from "@/lib/db";
import { uid } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  seedDemoIfEmpty();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (studentId) {
    const rows = entriesForStudent(studentId);
    return NextResponse.json({ entries: rows });
  }
  const grade = Number(searchParams.get("grade") || 5);
  const lessons = listLessons(grade);
  const entries = listEntries(lessons.map((l) => l.id));
  return NextResponse.json({ lessons, entries });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<JournalEntry>;
  if (!body.lessonId || !body.studentId) {
    return NextResponse.json({ error: "lessonId, studentId required" }, { status: 400 });
  }
  const entry: JournalEntry = {
    id: body.id || uid("entry"),
    lessonId: body.lessonId,
    studentId: body.studentId,
    mark: body.mark ?? null,
    attendance: (body.attendance as Attendance) || "present",
    comment: body.comment ?? null,
    updatedAt: new Date().toISOString(),
  };
  upsertEntry(entry);
  return NextResponse.json({ entry });
}
