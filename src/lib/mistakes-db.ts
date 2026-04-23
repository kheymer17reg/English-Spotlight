import "server-only";
import { getDb } from "@/lib/db";
import type { Grade, MistakeKind, MistakeRecord, MistakeSource, MistakeStatus } from "@/types";

function rowToMistake(row: Record<string, unknown>): MistakeRecord {
  return {
    id: row.id as number,
    studentId: row.studentId as string,
    kind: row.kind as MistakeKind,
    source: row.source as MistakeSource,
    question: row.question as string,
    correctAnswer: row.correctAnswer as string,
    studentAnswer: (row.studentAnswer as string | null) ?? null,
    wordId: (row.wordId as string | null) ?? null,
    moduleNumber: (row.moduleNumber as number | null) ?? null,
    grade: row.grade as Grade,
    status: row.status as MistakeStatus,
    nextDue: (row.nextDue as string | null) ?? null,
    timesSeen: row.timesSeen as number,
    timesCorrect: row.timesCorrect as number,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export interface AddMistakeInput {
  studentId: string;
  kind: MistakeKind;
  source: MistakeSource;
  question: string;
  correctAnswer: string;
  studentAnswer?: string | null;
  wordId?: string | null;
  moduleNumber?: number | null;
  grade: Grade;
}

export function addMistake(input: AddMistakeInput): MistakeRecord {
  const db = getDb();
  const now = new Date().toISOString();
  const due = new Date();
  due.setUTCHours(0, 0, 0, 0);
  const nextDue = due.toISOString().slice(0, 10);
  const info = db
    .prepare(
      `INSERT INTO student_mistakes
       (studentId, kind, source, question, correctAnswer, studentAnswer, wordId, moduleNumber, grade, status, nextDue, timesSeen, timesCorrect, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 1, 0, ?, ?)`,
    )
    .run(
      input.studentId,
      input.kind,
      input.source,
      input.question,
      input.correctAnswer,
      input.studentAnswer ?? null,
      input.wordId ?? null,
      input.moduleNumber ?? null,
      input.grade,
      nextDue,
      now,
      now,
    );
  const row = db
    .prepare(`SELECT * FROM student_mistakes WHERE id = ?`)
    .get(info.lastInsertRowid) as Record<string, unknown>;
  return rowToMistake(row);
}

export function listActiveMistakes(studentId: string, limit = 200): MistakeRecord[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM student_mistakes WHERE studentId = ? AND status = 'active' ORDER BY nextDue ASC, id DESC LIMIT ?`,
    )
    .all(studentId, limit) as Record<string, unknown>[];
  return rows.map(rowToMistake);
}

export function listDueMistakes(studentId: string, now = new Date()): MistakeRecord[] {
  const today = now.toISOString().slice(0, 10);
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM student_mistakes
        WHERE studentId = ? AND status = 'active' AND (nextDue IS NULL OR nextDue <= ?)
        ORDER BY nextDue ASC, id DESC`,
    )
    .all(studentId, today) as Record<string, unknown>[];
  return rows.map(rowToMistake);
}

export function mistakeStats(studentId: string): { active: number; mastered: number; dueNow: number } {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const row = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) AS mastered,
         SUM(CASE WHEN status = 'active' AND (nextDue IS NULL OR nextDue <= ?) THEN 1 ELSE 0 END) AS dueNow
       FROM student_mistakes
       WHERE studentId = ?`,
    )
    .get(today, studentId) as { active: number | null; mastered: number | null; dueNow: number | null };
  return { active: row.active ?? 0, mastered: row.mastered ?? 0, dueNow: row.dueNow ?? 0 };
}

// Review a mistake: correct ⇒ bump timesCorrect, schedule next due (1→3→7 days).
// Incorrect ⇒ reset timesCorrect to 0, next due in 1 day, stays active.
export function reviewMistake(
  studentId: string,
  id: number,
  wasCorrect: boolean,
): MistakeRecord | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM student_mistakes WHERE id = ? AND studentId = ?`)
    .get(id, studentId) as Record<string, unknown> | undefined;
  if (!row) return null;
  const current = rowToMistake(row);
  const now = new Date();
  const nowIso = now.toISOString();
  const nextDate = new Date(now);
  nextDate.setUTCHours(0, 0, 0, 0);
  let timesCorrect = current.timesCorrect;
  let status: MistakeStatus = current.status;
  if (wasCorrect) {
    timesCorrect += 1;
    const delta = timesCorrect === 1 ? 1 : timesCorrect === 2 ? 3 : 7;
    nextDate.setUTCDate(nextDate.getUTCDate() + delta);
    if (timesCorrect >= 3) status = "mastered";
  } else {
    timesCorrect = 0;
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  }
  const nextDueIso = nextDate.toISOString().slice(0, 10);
  db.prepare(
    `UPDATE student_mistakes
        SET timesSeen = timesSeen + 1,
            timesCorrect = ?,
            status = ?,
            nextDue = ?,
            updatedAt = ?
      WHERE id = ?`,
  ).run(timesCorrect, status, nextDueIso, nowIso, id);
  const updated = db
    .prepare(`SELECT * FROM student_mistakes WHERE id = ?`)
    .get(id) as Record<string, unknown>;
  return rowToMistake(updated);
}
