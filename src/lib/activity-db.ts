import "server-only";
import { getDb } from "@/lib/db";
import type { ActivityRecord, ActivityType } from "@/types";
import { BADGES, BADGE_MAP, evaluateBadges, type BadgeContext } from "@/lib/badges";

export interface LogActivityInput {
  studentId: string;
  activityType: ActivityType;
  xp: number;
  correct?: number;
  total?: number;
  skill?: "grammar" | "vocabulary" | "reading" | "listening" | "speaking";
  moduleNumber?: number;
  meta?: Record<string, unknown>;
}

function rowToActivity(row: Record<string, unknown>): ActivityRecord {
  const metaRaw = row.meta as string | null;
  return {
    id: row.id as number,
    studentId: row.studentId as string,
    activityType: row.activityType as ActivityType,
    xp: row.xp as number,
    correct: (row.correct as number | null) ?? null,
    total: (row.total as number | null) ?? null,
    skill: (row.skill as ActivityRecord["skill"]) ?? null,
    moduleNumber: (row.moduleNumber as number | null) ?? null,
    meta: metaRaw ? (JSON.parse(metaRaw) as Record<string, unknown>) : null,
    createdAt: row.createdAt as string,
  };
}

export function logActivity(input: LogActivityInput): ActivityRecord {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO student_activity (studentId, activityType, xp, correct, total, skill, moduleNumber, meta, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.studentId,
      input.activityType,
      Math.max(0, Math.round(input.xp)),
      input.correct ?? null,
      input.total ?? null,
      input.skill ?? null,
      input.moduleNumber ?? null,
      input.meta ? JSON.stringify(input.meta) : null,
      now,
    );
  const row = db
    .prepare(`SELECT * FROM student_activity WHERE id = ?`)
    .get(info.lastInsertRowid) as Record<string, unknown>;
  return rowToActivity(row);
}

export function recentActivities(studentId: string, limit = 20): ActivityRecord[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM student_activity WHERE studentId = ? ORDER BY id DESC LIMIT ?`)
    .all(studentId, limit) as Record<string, unknown>[];
  return rows.map(rowToActivity);
}

// Consecutive days with ≥1 activity ending at today (or yesterday if idle today).
export function computeStreak(studentId: string, now = new Date()): number {
  const db = getDb();
  // Fetch distinct YYYY-MM-DD of activity (local date of server).
  const rows = db
    .prepare(
      `SELECT DISTINCT substr(createdAt, 1, 10) AS day
       FROM student_activity
       WHERE studentId = ?
       ORDER BY day DESC
       LIMIT 400`,
    )
    .all(studentId) as { day: string }[];
  if (rows.length === 0) return 0;
  const days = new Set(rows.map((r) => r.day));
  // Walk backwards from today; allow one-day grace (if no activity today but was yesterday, keep streak).
  const today = now.toISOString().slice(0, 10);
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);
  if (!days.has(today)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function xpSince(studentId: string, sinceIso: string): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(xp), 0) AS total FROM student_activity WHERE studentId = ? AND createdAt >= ?`,
    )
    .get(studentId, sinceIso) as { total: number } | undefined;
  return row?.total ?? 0;
}

export function totalXp(studentId: string): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT COALESCE(SUM(xp), 0) AS total FROM student_activity WHERE studentId = ?`)
    .get(studentId) as { total: number } | undefined;
  return row?.total ?? 0;
}

// Start of current ISO week (Monday 00:00 UTC) as ISO string.
export function weekStart(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const delta = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - delta);
  return d;
}

export function weekEnd(now = new Date()): Date {
  const start = weekStart(now);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return end;
}

export function skillAccuracy(studentId: string): { skill: string; accuracy: number; attempts: number }[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT skill,
              SUM(total) AS totalQs,
              SUM(correct) AS correctQs,
              COUNT(*) AS attempts
         FROM student_activity
        WHERE studentId = ? AND skill IS NOT NULL AND total IS NOT NULL AND correct IS NOT NULL
        GROUP BY skill`,
    )
    .all(studentId) as { skill: string; totalQs: number; correctQs: number; attempts: number }[];
  return rows.map((r) => ({
    skill: r.skill,
    accuracy: r.totalQs > 0 ? Math.round((r.correctQs / r.totalQs) * 100) : 0,
    attempts: r.attempts,
  }));
}

export function weeklyXpBuckets(studentId: string, now = new Date()): { day: string; xp: number }[] {
  const db = getDb();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 6);
  const rows = db
    .prepare(
      `SELECT substr(createdAt, 1, 10) AS day, SUM(xp) AS xp
       FROM student_activity
       WHERE studentId = ? AND createdAt >= ?
       GROUP BY day`,
    )
    .all(studentId, start.toISOString()) as { day: string; xp: number }[];
  const map = new Map(rows.map((r) => [r.day, r.xp]));
  const out: { day: string; xp: number }[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, xp: map.get(key) ?? 0 });
  }
  return out;
}

export function perfectExerciseStreak(studentId: string): number {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT correct, total FROM student_activity
        WHERE studentId = ? AND activityType IN ('exercise', 'homework') AND total IS NOT NULL
        ORDER BY id DESC LIMIT 20`,
    )
    .all(studentId) as { correct: number | null; total: number | null }[];
  let run = 0;
  for (const r of rows) {
    if (r.total && r.correct === r.total) run += 1;
    else break;
  }
  return run;
}

export function daysSinceLastActivity(studentId: string, now = new Date()): number | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT createdAt FROM student_activity WHERE studentId = ? ORDER BY id DESC LIMIT 1 OFFSET 1`,
    )
    .get(studentId) as { createdAt: string } | undefined;
  if (!row) return null;
  const last = new Date(row.createdAt);
  const ms = now.getTime() - last.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function getUnlockedBadges(studentId: string): { badgeId: string; unlockedAt: string }[] {
  const db = getDb();
  return db
    .prepare(`SELECT badgeId, unlockedAt FROM student_badges WHERE studentId = ? ORDER BY unlockedAt DESC`)
    .all(studentId) as { badgeId: string; unlockedAt: string }[];
}

export function unlockBadges(studentId: string, badgeIds: string[]): string[] {
  if (!badgeIds.length) return [];
  const db = getDb();
  const existing = new Set(
    (db.prepare(`SELECT badgeId FROM student_badges WHERE studentId = ?`).all(studentId) as {
      badgeId: string;
    }[]).map((r) => r.badgeId),
  );
  const fresh: string[] = [];
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO student_badges (studentId, badgeId, unlockedAt) VALUES (?, ?, ?)`,
  );
  const now = new Date().toISOString();
  for (const id of badgeIds) {
    if (existing.has(id)) continue;
    if (!BADGE_MAP[id]) continue;
    stmt.run(studentId, id, now);
    fresh.push(id);
  }
  return fresh;
}

export function countMasteredMistakes(studentId: string): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM student_mistakes WHERE studentId = ? AND status = 'mastered'`)
    .get(studentId) as { n: number } | undefined;
  return row?.n ?? 0;
}

export interface ActivityResult {
  activity: ActivityRecord;
  xp: number;
  level: number;
  streak: number;
  newBadges: string[];
}

// Main entry: log an activity + recompute student cached stats + evaluate badges.
export function recordActivity(input: LogActivityInput): ActivityResult {
  const db = getDb();
  const activity = logActivity(input);
  const now = new Date();

  const xp = totalXp(input.studentId);
  const level = 1 + Math.floor(xp / 200);
  const streak = computeStreak(input.studentId, now);

  db.prepare(`UPDATE students SET xp = ?, level = ?, streak = ? WHERE id = ?`).run(
    xp,
    level,
    streak,
    input.studentId,
  );

  const mastered = countMasteredMistakes(input.studentId);
  const fixedRow = db
    .prepare(`SELECT COUNT(*) AS n FROM student_activity WHERE studentId = ? AND activityType = 'mistake_review'`)
    .get(input.studentId) as { n: number } | undefined;
  const mistakesFixed = fixedRow?.n ?? 0;

  const ctx: BadgeContext = {
    xp,
    streak,
    masteredWords: mastered,
    perfectExerciseStreak: perfectExerciseStreak(input.studentId),
    hourOfDay: now.getUTCHours(),
    daysSinceLastActivity: daysSinceLastActivity(input.studentId, now),
    mistakesFixed,
  };
  const candidate = evaluateBadges(ctx);
  const fresh = unlockBadges(input.studentId, candidate);

  return { activity, xp, level, streak, newBadges: fresh };
}

export const ALL_BADGES = BADGES;
