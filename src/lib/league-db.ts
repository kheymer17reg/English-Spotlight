import "server-only";
import { getDb } from "@/lib/db";
import type { LeagueEntry, LeagueResponse } from "@/types";
import { weekEnd, weekStart } from "@/lib/activity-db";

// Find the group the student belongs to as a student (not teacher).
// Falls back to null (school-wide league).
export function findStudentGroup(studentId: string): { id: string; name: string } | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT g.id AS id, g.name AS name
         FROM group_members gm
         JOIN groups g ON g.id = gm.groupId
         JOIN users u ON u.id = gm.userId
        WHERE u.studentId = ? AND gm.role = 'student'
        ORDER BY gm.joinedAt ASC
        LIMIT 1`,
    )
    .get(studentId) as { id: string; name: string } | undefined;
  return row ?? null;
}

// Build leaderboard scoped by group (class) or school-wide.
export function buildLeague(studentId: string, now = new Date()): LeagueResponse {
  const db = getDb();
  const group = findStudentGroup(studentId);
  const start = weekStart(now).toISOString();
  const end = weekEnd(now).toISOString();

  type Row = {
    studentId: string;
    name: string;
    xpThisWeek: number;
    level: number;
    badgesCount: number;
  };

  let rows: Row[];
  if (group) {
    rows = db
      .prepare(
        `SELECT s.id AS studentId,
                s.name AS name,
                COALESCE(SUM(a.xp), 0) AS xpThisWeek,
                s.level AS level,
                (SELECT COUNT(*) FROM student_badges b WHERE b.studentId = s.id) AS badgesCount
           FROM students s
           JOIN users u ON u.studentId = s.id
           JOIN group_members gm ON gm.userId = u.id
           LEFT JOIN student_activity a
                  ON a.studentId = s.id AND a.createdAt >= ? AND a.createdAt < ?
          WHERE gm.groupId = ? AND gm.role = 'student'
          GROUP BY s.id
          ORDER BY xpThisWeek DESC, s.xp DESC
          LIMIT 50`,
      )
      .all(start, end, group.id) as Row[];
  } else {
    rows = db
      .prepare(
        `SELECT s.id AS studentId,
                s.name AS name,
                COALESCE(SUM(a.xp), 0) AS xpThisWeek,
                s.level AS level,
                (SELECT COUNT(*) FROM student_badges b WHERE b.studentId = s.id) AS badgesCount
           FROM students s
           LEFT JOIN student_activity a
                  ON a.studentId = s.id AND a.createdAt >= ? AND a.createdAt < ?
          GROUP BY s.id
          ORDER BY xpThisWeek DESC, s.xp DESC
          LIMIT 50`,
      )
      .all(start, end) as Row[];
  }

  const top: LeagueEntry[] = rows.slice(0, 10).map((r, idx) => ({
    rank: idx + 1,
    studentId: r.studentId,
    name: r.name,
    xpThisWeek: r.xpThisWeek,
    level: r.level,
    badgesCount: r.badgesCount,
    isMe: r.studentId === studentId,
  }));

  let me: LeagueEntry | null = null;
  const meRowIdx = rows.findIndex((r) => r.studentId === studentId);
  if (meRowIdx >= 0) {
    const r = rows[meRowIdx];
    me = {
      rank: meRowIdx + 1,
      studentId: r.studentId,
      name: r.name,
      xpThisWeek: r.xpThisWeek,
      level: r.level,
      badgesCount: r.badgesCount,
      isMe: true,
    };
  }

  return {
    scope: group ? "class" : "school",
    groupId: group?.id ?? null,
    groupName: group?.name ?? null,
    weekStart: start,
    weekEnd: end,
    top,
    me,
  };
}
