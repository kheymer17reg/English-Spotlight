import "server-only";
import { getDb } from "@/lib/db";
import type { Grade, MethodicalLesson } from "@/types";

type Row = {
  id: string;
  grade: number;
  moduleNumber: number;
  moduleTitle: string;
  lessonNumber: number;
  kind: string;
  title: string;
  textbookPages: string;
  duration: number;
  lessonType: string;
  objectives: string; // JSON
  equipment: string; // JSON
  vocabulary: string; // JSON
  grammar: string; // JSON
  stages: string; // JSON
  reflection: string;
  homework: string;
  handouts: string; // JSON
  status: MethodicalLesson["status"];
  createdAt: string;
  updatedAt: string;
};

function rowToLesson(r: Row): MethodicalLesson {
  return {
    id: r.id,
    grade: r.grade as Grade,
    moduleNumber: r.moduleNumber,
    moduleTitle: r.moduleTitle,
    lessonNumber: r.lessonNumber,
    kind: r.kind as MethodicalLesson["kind"],
    title: r.title,
    textbookPages: r.textbookPages,
    duration: r.duration,
    lessonType: r.lessonType,
    objectives: JSON.parse(r.objectives),
    equipment: JSON.parse(r.equipment),
    vocabulary: JSON.parse(r.vocabulary),
    grammar: JSON.parse(r.grammar),
    stages: JSON.parse(r.stages),
    reflection: r.reflection,
    homework: r.homework,
    handouts: JSON.parse(r.handouts),
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function upsertMethodicalLesson(l: MethodicalLesson): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO methodical_lessons (
       id, grade, moduleNumber, moduleTitle, lessonNumber, kind, title, textbookPages,
       duration, lessonType, objectives, equipment, vocabulary, grammar, stages,
       reflection, homework, handouts, status, createdAt, updatedAt
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       grade=excluded.grade,
       moduleNumber=excluded.moduleNumber,
       moduleTitle=excluded.moduleTitle,
       lessonNumber=excluded.lessonNumber,
       kind=excluded.kind,
       title=excluded.title,
       textbookPages=excluded.textbookPages,
       duration=excluded.duration,
       lessonType=excluded.lessonType,
       objectives=excluded.objectives,
       equipment=excluded.equipment,
       vocabulary=excluded.vocabulary,
       grammar=excluded.grammar,
       stages=excluded.stages,
       reflection=excluded.reflection,
       homework=excluded.homework,
       handouts=excluded.handouts,
       status=excluded.status,
       updatedAt=excluded.updatedAt`,
  ).run(
    l.id,
    l.grade,
    l.moduleNumber,
    l.moduleTitle,
    l.lessonNumber,
    l.kind,
    l.title,
    l.textbookPages,
    l.duration,
    l.lessonType,
    JSON.stringify(l.objectives),
    JSON.stringify(l.equipment),
    JSON.stringify(l.vocabulary),
    JSON.stringify(l.grammar),
    JSON.stringify(l.stages),
    l.reflection,
    l.homework,
    JSON.stringify(l.handouts),
    l.status,
    l.createdAt,
    l.updatedAt,
  );
}

export function listMethodicalLessons(filter?: {
  grade?: Grade;
  moduleNumber?: number;
}): MethodicalLesson[] {
  const db = getDb();
  const parts: string[] = [];
  const args: (string | number)[] = [];
  if (filter?.grade) {
    parts.push("grade = ?");
    args.push(filter.grade);
  }
  if (filter?.moduleNumber) {
    parts.push("moduleNumber = ?");
    args.push(filter.moduleNumber);
  }
  const where = parts.length ? `WHERE ${parts.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT * FROM methodical_lessons ${where}
       ORDER BY grade ASC, moduleNumber ASC, lessonNumber ASC`,
    )
    .all(...args) as Row[];
  return rows.map(rowToLesson);
}

export function getMethodicalLesson(id: string): MethodicalLesson | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM methodical_lessons WHERE id = ? LIMIT 1`)
    .get(id) as Row | undefined;
  return row ? rowToLesson(row) : null;
}

export function methodicalStats(): {
  total: number;
  generated: number;
  stub: number;
  edited: number;
} {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) AS generated,
         SUM(CASE WHEN status = 'stub' THEN 1 ELSE 0 END) AS stub,
         SUM(CASE WHEN status = 'edited' THEN 1 ELSE 0 END) AS edited
       FROM methodical_lessons`,
    )
    .get() as { total: number; generated: number | null; stub: number | null; edited: number | null };
  return {
    total: row.total ?? 0,
    generated: row.generated ?? 0,
    stub: row.stub ?? 0,
    edited: row.edited ?? 0,
  };
}
