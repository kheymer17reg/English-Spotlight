import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  ALL_BADGES,
  computeStreak,
  getUnlockedBadges,
  recentActivities,
  skillAccuracy,
  totalXp,
  weekStart,
  weeklyXpBuckets,
  xpSince,
} from "@/lib/activity-db";
import { mistakeStats } from "@/lib/mistakes-db";
import type { Grade, StudentProgressReport, UnlockedBadge } from "@/types";
import { logError } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }
    const db = getDb();
    const s = db
      .prepare(`SELECT id, name, grade FROM students WHERE id = ?`)
      .get(studentId) as { id: string; name: string; grade: number } | undefined;
    if (!s) {
      return NextResponse.json({ error: "student not found" }, { status: 404 });
    }

    const xp = totalXp(studentId);
    const level = 1 + Math.floor(xp / 200);
    const streak = computeStreak(studentId);
    const xpThisWeek = xpSince(studentId, weekStart().toISOString());

    const unlockedRows = getUnlockedBadges(studentId);
    const unlockedMap = new Map(unlockedRows.map((r) => [r.badgeId, r.unlockedAt]));
    const unlocked: UnlockedBadge[] = [];
    const locked = [];
    for (const def of ALL_BADGES) {
      const u = unlockedMap.get(def.id);
      if (u) unlocked.push({ ...def, unlockedAt: u });
      else locked.push(def);
    }

    const report: StudentProgressReport = {
      student: {
        id: s.id,
        name: s.name,
        grade: s.grade as Grade,
        xp,
        level,
        streak,
        xpThisWeek,
      },
      skills: skillAccuracy(studentId),
      recent: recentActivities(studentId, 20),
      badges: { unlocked, locked },
      mistakes: mistakeStats(studentId),
      weeklyXp: weeklyXpBuckets(studentId),
    };
    return NextResponse.json(report);
  } catch (err) {
    await logError("/api/student/progress", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
