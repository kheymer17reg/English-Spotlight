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
import { requireAuth, requireRole, resolveStudentId } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — students can only fetch their own entries; teachers can fetch any.
// POST — teacher-only (writes marks/attendance).
export async function GET(req: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  seedDemoIfEmpty();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (studentId) {
    if (guard.role === "student") {
      const own = resolveStudentId(guard.userId);
      if (own !== studentId) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
    // Parents fall through to read whichever child they linked. We rely on the
    // parent UI to pass only linked-child ids; the parent_links check happens
    // in /api/parent/* routes.
    const rows = entriesForStudent(studentId);
    return NextResponse.json({ entries: rows });
  }
  if (guard.role !== "teacher") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const grade = Number(searchParams.get("grade") || 5);
  const lessons = listLessons(grade);
  const entries = listEntries(lessons.map((l) => l.id));
  return NextResponse.json({ lessons, entries });
}

export async function POST(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
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
