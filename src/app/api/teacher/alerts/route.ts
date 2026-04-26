import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Teacher dashboard: time-sensitive signals at the top of `/teacher`.
 *
 * Returns four buckets so the dashboard can surface alerts the way a school
 * CRM does ("3 ученика не сдали ДЗ", "2 урока завтра", etc.):
 *  - `overdueHomework`: homeworks past their due date with a non-zero number
 *                       of students who haven't completed them yet
 *  - `newFeedback`:     feedback rows still in the `'new'` status
 *  - `tomorrowLessons`: journal_lessons scheduled for tomorrow
 *  - `inactiveStudents`: students with no `student_activity` rows in the last 7 days
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "auth required" }, { status: 401 });
  }
  const db = getDb();

  const nowIso = new Date().toISOString();
  const overdueRows = db
    .prepare(
      `SELECT h.id, h.title, h.grade, h.dueDate,
              (SELECT COUNT(*) FROM students s
                 WHERE s.grade = h.grade
                   AND NOT EXISTS (
                     SELECT 1 FROM homework_completions c
                      WHERE c.homeworkId = h.id AND c.studentId = s.id
                   )
              ) AS pending
         FROM homework h
        WHERE h.dueDate IS NOT NULL AND h.dueDate < ?
        ORDER BY h.dueDate DESC
        LIMIT 8`,
    )
    .all(nowIso) as {
    id: string;
    title: string;
    grade: number;
    dueDate: string;
    pending: number;
  }[];
  const overdueHomework = overdueRows.filter((r) => r.pending > 0);

  const newFeedbackRow = db
    .prepare(`SELECT COUNT(*) AS n FROM feedback WHERE status = 'new'`)
    .get() as { n: number };
  const newFeedback = newFeedbackRow.n;

  // Tomorrow = local midnight + 1 day in the server timezone. We store dates
  // as plain `YYYY-MM-DD` strings in `journal_lessons`, so simple string match
  // is enough.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const tomorrowLessons = db
    .prepare(
      `SELECT id, grade, topic, module
         FROM journal_lessons
        WHERE date = ?
        ORDER BY grade, module`,
    )
    .all(tomorrowKey) as { id: string; grade: number; topic: string; module: number }[];

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();
  const inactiveStudents = db
    .prepare(
      `SELECT s.id, s.name, s.grade
         FROM students s
        WHERE NOT EXISTS (
          SELECT 1 FROM student_activity a
           WHERE a.studentId = s.id AND a.createdAt >= ?
        )
        ORDER BY s.grade, s.name
        LIMIT 8`,
    )
    .all(weekAgoIso) as { id: string; name: string; grade: number }[];

  return NextResponse.json({
    overdueHomework,
    newFeedback,
    tomorrowLessons,
    inactiveStudents,
  });
}
