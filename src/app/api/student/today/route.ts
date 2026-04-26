import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findUserById, getDb, listHomework } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Today's checklist for the student dashboard.
 *
 * Returns:
 *  - `pendingHomework`: list of homeworks assigned to the user that the user
 *                       hasn't completed yet (max 3, soonest due first)
 *  - `done`: which of the daily quests are already considered done today, by
 *            counting `student_activity` rows of the matching `activityType`
 *            with `createdAt >= startOfDay`
 *  - `todayXp`: XP earned today (used for the daily progress strip)
 *
 * GET /api/student/today
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "auth required" }, { status: 401 });
  }
  const studentId = session.user.id;
  const userRecord = findUserById(studentId);
  const grade = userRecord?.grade ?? undefined;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const since = todayStart.toISOString();
  const db = getDb();

  // How many activities of each kind has the student done today?
  const rows = db
    .prepare(
      `SELECT activityType, COUNT(*) AS n, COALESCE(SUM(xp), 0) AS xp
         FROM student_activity
        WHERE studentId = ? AND createdAt >= ?
        GROUP BY activityType`,
    )
    .all(studentId, since) as { activityType: string; n: number; xp: number }[];
  const counts = new Map(rows.map((r) => [r.activityType, r.n] as const));
  const todayXp = rows.reduce((acc, r) => acc + (r.xp || 0), 0);

  const done = {
    vocab: (counts.get("vocab_review") ?? 0) >= 5,
    practice: (counts.get("exercise") ?? 0) >= 1,
    reading: (counts.get("reading") ?? 0) >= 1,
    pair: (counts.get("roleplay") ?? 0) + (counts.get("chat") ?? 0) >= 1,
    pronunciation: (counts.get("pronunciation") ?? 0) >= 1,
  };

  // Homework not yet completed by this student.
  const homeworks = listHomework(grade, studentId);
  const completedIds = new Set<string>();
  if (homeworks.length > 0) {
    const placeholders = homeworks.map(() => "?").join(",");
    const completionRows = db
      .prepare(
        `SELECT homeworkId FROM homework_completions
          WHERE studentId = ? AND homeworkId IN (${placeholders})`,
      )
      .all(studentId, ...homeworks.map((h) => h.id)) as { homeworkId: string }[];
    for (const r of completionRows) completedIds.add(r.homeworkId);
  }
  const pendingHomework = homeworks
    .filter((h) => !completedIds.has(h.id))
    .sort((a, b) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    })
    .slice(0, 3)
    .map((h) => ({
      id: h.id,
      title: h.title,
      dueDate: h.dueDate ?? null,
      resourceType: h.resourceType,
    }));

  return NextResponse.json({
    pendingHomework,
    done,
    todayXp,
  });
}
