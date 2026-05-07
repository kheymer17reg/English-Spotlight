import "server-only";
import { getDb } from "@/lib/db";

/**
 * Parent ↔ child binding.
 *
 * Each student gets a stable 6-character `linkCode` (in `students.linkCode`),
 * which a parent enters once to bind themselves. The mapping lives in
 * `parent_links(parentUserId, studentId)`. A parent can be bound to multiple
 * children (siblings); a student can be observed by multiple parents.
 *
 * Codes are alphanumeric without ambiguous characters (no 0/O/I/1) for easy
 * dictation. Codes are only generated lazily — the first time a student's
 * profile is asked for one, it gets persisted.
 */

let migrated = false;
function ensureMigrated() {
  if (migrated) return;
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS parent_links (
      parentUserId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (parentUserId, studentId)
    );
    CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_links(parentUserId);
    CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_links(studentId);
  `);
  // Add linkCode column if it doesn't exist yet.
  try {
    const cols = db.prepare(`PRAGMA table_info(students)`).all() as { name: string }[];
    if (!cols.some((c) => c.name === "linkCode")) {
      db.exec(`ALTER TABLE students ADD COLUMN linkCode TEXT`);
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_students_linkCode ON students(linkCode)`);
    }
  } catch {
    // pragma errors are non-fatal for migration probing
  }
  migrated = true;
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 6): string {
  let s = "";
  for (let i = 0; i < len; i += 1) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return s;
}

export function getOrCreateLinkCode(studentId: string): string | null {
  ensureMigrated();
  const db = getDb();
  const row = db
    .prepare(`SELECT linkCode FROM students WHERE id = ?`)
    .get(studentId) as { linkCode: string | null } | undefined;
  if (!row) return null;
  if (row.linkCode) return row.linkCode;
  // Generate a unique code (collision is astronomically unlikely with 32^6 ≈ 1B).
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomCode();
    const taken = db.prepare(`SELECT id FROM students WHERE linkCode = ?`).get(code);
    if (taken) continue;
    db.prepare(`UPDATE students SET linkCode = ? WHERE id = ?`).run(code, studentId);
    return code;
  }
  return null;
}

export function findStudentByLinkCode(code: string): { id: string; name: string; grade: number } | null {
  ensureMigrated();
  const db = getDb();
  const row = db
    .prepare(`SELECT id, name, grade FROM students WHERE linkCode = ? LIMIT 1`)
    .get(code.trim().toUpperCase()) as { id: string; name: string; grade: number } | undefined;
  return row ?? null;
}

export interface ChildSummary {
  id: string;
  name: string;
  grade: number;
  xp: number;
  level: number;
  streak: number;
}

export function listChildren(parentUserId: string): ChildSummary[] {
  ensureMigrated();
  const db = getDb();
  return db
    .prepare(
      `SELECT s.id, s.name, s.grade, s.xp, s.level, s.streak
         FROM parent_links pl
         JOIN students s ON s.id = pl.studentId
        WHERE pl.parentUserId = ?
        ORDER BY pl.createdAt ASC`,
    )
    .all(parentUserId) as ChildSummary[];
}

export function isParentOfStudent(parentUserId: string, studentId: string): boolean {
  ensureMigrated();
  const db = getDb();
  const row = db
    .prepare(
      `SELECT 1 FROM parent_links WHERE parentUserId = ? AND studentId = ? LIMIT 1`,
    )
    .get(parentUserId, studentId);
  return Boolean(row);
}

export function linkParentToStudent(parentUserId: string, studentId: string): boolean {
  ensureMigrated();
  const db = getDb();
  const info = db
    .prepare(
      `INSERT OR IGNORE INTO parent_links (parentUserId, studentId, createdAt) VALUES (?, ?, ?)`,
    )
    .run(parentUserId, studentId, new Date().toISOString());
  return info.changes > 0;
}

export function unlinkParentFromStudent(parentUserId: string, studentId: string): void {
  ensureMigrated();
  const db = getDb();
  db.prepare(`DELETE FROM parent_links WHERE parentUserId = ? AND studentId = ?`).run(
    parentUserId,
    studentId,
  );
}
