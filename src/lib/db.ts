import "server-only";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import type { AttemptRecord, Grade, StudentRecord } from "@/types";

let _db: Database.Database | null = null;

export function getDb() {
  if (_db) return _db;
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "spotlight.db");
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      streak INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      currentModule INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      kind TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      skill TEXT NOT NULL,
      module INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS errors_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      when_at TEXT NOT NULL,
      where_at TEXT NOT NULL,
      message TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts(studentId);
    CREATE INDEX IF NOT EXISTS idx_attempts_skill ON attempts(skill);
  `);
  _db = db;
  return db;
}

export function upsertStudent(s: StudentRecord) {
  const db = getDb();
  db.prepare(
    `INSERT INTO students (id,name,grade,createdAt,streak,xp,level,currentModule)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, grade=excluded.grade, streak=excluded.streak,
       xp=excluded.xp, level=excluded.level, currentModule=excluded.currentModule`,
  ).run(s.id, s.name, s.grade, s.createdAt, s.streak, s.xp, s.level, s.currentModule);
}

export function listStudents(filter?: { grade?: Grade; q?: string }): StudentRecord[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (filter?.grade) {
    clauses.push("grade = ?");
    params.push(filter.grade);
  }
  if (filter?.q) {
    clauses.push("LOWER(name) LIKE ?");
    params.push(`%${filter.q.toLowerCase()}%`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM students ${where} ORDER BY xp DESC, name ASC`).all(...params) as StudentRecord[];
}

export function getStudent(id: string): StudentRecord | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM students WHERE id = ?`).get(id) as StudentRecord | undefined;
}

export function saveAttempt(a: AttemptRecord) {
  const db = getDb();
  db.prepare(
    `INSERT INTO attempts (id,studentId,kind,score,total,correct,skill,module,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(a.id, a.studentId, a.kind, a.score, a.total, a.correct, a.skill, a.module, a.createdAt);
  // Nudge XP on save.
  const earned = Math.max(0, Math.round((a.correct / Math.max(1, a.total)) * 20));
  db.prepare(`UPDATE students SET xp = xp + ?, level = 1 + xp/200 WHERE id = ?`).run(earned, a.studentId);
}

export function attemptsForStudent(id: string): AttemptRecord[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM attempts WHERE studentId = ? ORDER BY createdAt DESC`)
    .all(id) as AttemptRecord[];
}

export function globalStats() {
  const db = getDb();
  const students = db.prepare(`SELECT COUNT(*) AS n FROM students`).get() as { n: number };
  const attempts = db.prepare(`SELECT COUNT(*) AS n FROM attempts`).get() as { n: number };
  const avg = db
    .prepare(
      `SELECT AVG(CAST(correct AS FLOAT) / NULLIF(total,0)) AS acc, skill FROM attempts GROUP BY skill`,
    )
    .all() as { acc: number; skill: string }[];
  return { students: students.n, attempts: attempts.n, skillAccuracy: avg };
}

export function logError(where_at: string, message: string) {
  const db = getDb();
  db.prepare(`INSERT INTO errors_log (when_at,where_at,message) VALUES (?,?,?)`).run(
    new Date().toISOString(),
    where_at,
    message.slice(0, 4000),
  );
}

export function seedDemoIfEmpty() {
  const db = getDb();
  const row = db.prepare(`SELECT COUNT(*) AS n FROM students`).get() as { n: number };
  if (row.n > 0) return;
  const demo: StudentRecord[] = [
    { id: "demo-anya", name: "Аня Королёва", grade: 5, createdAt: new Date().toISOString(), streak: 7, xp: 320, level: 3, currentModule: 2 },
    { id: "demo-petya", name: "Петя Смирнов", grade: 5, createdAt: new Date().toISOString(), streak: 3, xp: 180, level: 2, currentModule: 2 },
    { id: "demo-lena", name: "Лена Кузнецова", grade: 7, createdAt: new Date().toISOString(), streak: 12, xp: 540, level: 4, currentModule: 3 },
    { id: "demo-misha", name: "Миша Иванов", grade: 3, createdAt: new Date().toISOString(), streak: 2, xp: 80, level: 1, currentModule: 1 },
    { id: "demo-sasha", name: "Саша Новиков", grade: 8, createdAt: new Date().toISOString(), streak: 15, xp: 780, level: 5, currentModule: 3 },
    { id: "demo-kira", name: "Кира Громова", grade: 4, createdAt: new Date().toISOString(), streak: 0, xp: 40, level: 1, currentModule: 1 },
  ];
  for (const d of demo) upsertStudent(d);

  const now = Date.now();
  const skills: ("grammar" | "vocabulary" | "reading" | "listening")[] = [
    "grammar",
    "vocabulary",
    "reading",
    "listening",
  ];
  let n = 0;
  for (const s of demo) {
    for (let i = 0; i < 6; i++) {
      const total = 10;
      const correct = Math.max(4, total - Math.floor(Math.random() * 6));
      saveAttempt({
        id: `seed-${s.id}-${i}-${n++}`,
        studentId: s.id,
        kind: i % 2 === 0 ? "practice" : "vocab",
        total,
        correct,
        score: Math.round((correct / total) * 100),
        skill: skills[i % skills.length],
        module: s.currentModule,
        createdAt: new Date(now - i * 86400000).toISOString(),
      });
    }
  }
}
