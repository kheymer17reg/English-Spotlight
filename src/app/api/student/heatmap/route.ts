import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { isParentOfStudent } from "@/lib/parent-db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const studentParam = url.searchParams.get("studentId");
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 365) || 365, 30), 400);
  const studentId = studentParam ?? session.user.id;

  // Authorization:
  //   - student: only own data
  //   - teacher / parent: must be linked. We trust the api/parent flow + group
  //     membership to decide elsewhere; for now permit teachers to read and
  //     parents only when their parent_links matches.
  if (studentId !== session.user.id) {
    if (session.user.role === "teacher") {
      // ok
    } else if (session.user.role === "parent") {
      if (!isParentOfStudent(session.user.id, studentId)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const db = getDb();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days + 1);
  const rows = db
    .prepare(
      `SELECT substr(createdAt, 1, 10) AS day, SUM(xp) AS xp, COUNT(*) AS n
       FROM student_activity
       WHERE studentId = ? AND createdAt >= ?
       GROUP BY day
       ORDER BY day`,
    )
    .all(studentId, since.toISOString()) as { day: string; xp: number; n: number }[];

  // Build full day map so the heatmap renders contiguous blocks.
  const map: Record<string, { xp: number; n: number }> = {};
  for (const r of rows) map[r.day] = { xp: r.xp ?? 0, n: r.n ?? 0 };

  // Rolling streak: consecutive days with at least 1 activity ending today (UTC).
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if ((map[key]?.n ?? 0) > 0) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  let bestStreak = 0;
  let cur = 0;
  const start = new Date(since);
  for (let i = 0; i < days; i += 1) {
    const key = start.toISOString().slice(0, 10);
    if ((map[key]?.n ?? 0) > 0) {
      cur += 1;
      if (cur > bestStreak) bestStreak = cur;
    } else {
      cur = 0;
    }
    start.setUTCDate(start.getUTCDate() + 1);
  }

  return NextResponse.json({
    days,
    from: since.toISOString().slice(0, 10),
    activity: map,
    streak,
    bestStreak,
  });
}
