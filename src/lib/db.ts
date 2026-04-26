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
    CREATE TABLE IF NOT EXISTS journal_lessons (
      id TEXT PRIMARY KEY,
      grade INTEGER NOT NULL,
      date TEXT NOT NULL,
      topic TEXT NOT NULL,
      module INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_lessons_grade_date ON journal_lessons(grade, date);
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      lessonId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      mark TEXT,
      attendance TEXT NOT NULL DEFAULT 'present',
      comment TEXT,
      updatedAt TEXT NOT NULL,
      UNIQUE(lessonId, studentId)
    );
    CREATE INDEX IF NOT EXISTS idx_entries_student ON journal_entries(studentId);
    CREATE INDEX IF NOT EXISTS idx_entries_lesson ON journal_entries(lessonId);
    CREATE TABLE IF NOT EXISTS board_notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      thumbnail TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS homework (
      id TEXT PRIMARY KEY,
      grade INTEGER NOT NULL,
      title TEXT NOT NULL,
      instructions TEXT,
      resourceType TEXT NOT NULL,
      resourceId TEXT,
      resourcePayload TEXT,
      dueDate TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_homework_grade ON homework(grade);
    CREATE TABLE IF NOT EXISTS homework_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      homeworkId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'done',
      completedAt TEXT NOT NULL,
      UNIQUE(homeworkId, studentId)
    );
    CREATE TABLE IF NOT EXISTS pronunciation_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL,
      grade INTEGER NOT NULL,
      category TEXT NOT NULL,
      expected TEXT NOT NULL,
      transcript TEXT NOT NULL,
      score REAL NOT NULL,
      stars INTEGER NOT NULL,
      missedWords TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pron_student ON pronunciation_attempts(studentId);
    CREATE INDEX IF NOT EXISTS idx_pron_grade ON pronunciation_attempts(grade);
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      emailVerified TEXT,
      passwordHash TEXT,
      name TEXT,
      image TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      grade INTEGER,
      studentId TEXT,
      provider TEXT,
      providerAccountId TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, providerAccountId);
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      teacherId TEXT NOT NULL,
      joinCode TEXT UNIQUE NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_groups_teacher ON groups(teacherId);
    CREATE TABLE IF NOT EXISTS group_members (
      groupId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      joinedAt TEXT NOT NULL,
      PRIMARY KEY (groupId, userId)
    );
    CREATE INDEX IF NOT EXISTS idx_members_user ON group_members(userId);
    CREATE TABLE IF NOT EXISTS methodical_lessons (
      id TEXT PRIMARY KEY,
      grade INTEGER NOT NULL,
      moduleNumber INTEGER NOT NULL,
      moduleTitle TEXT NOT NULL,
      lessonNumber INTEGER NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      textbookPages TEXT NOT NULL,
      duration INTEGER NOT NULL,
      lessonType TEXT NOT NULL,
      objectives TEXT NOT NULL,
      equipment TEXT NOT NULL,
      vocabulary TEXT NOT NULL,
      grammar TEXT NOT NULL,
      stages TEXT NOT NULL,
      reflection TEXT NOT NULL DEFAULT '',
      homework TEXT NOT NULL DEFAULT '',
      handouts TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'stub',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_methodical_grade ON methodical_lessons(grade);
    CREATE INDEX IF NOT EXISTS idx_methodical_module ON methodical_lessons(grade, moduleNumber);
    CREATE TABLE IF NOT EXISTS student_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL,
      activityType TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      correct INTEGER,
      total INTEGER,
      skill TEXT,
      moduleNumber INTEGER,
      meta TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_activity_student ON student_activity(studentId);
    CREATE INDEX IF NOT EXISTS idx_activity_student_date ON student_activity(studentId, createdAt);
    CREATE INDEX IF NOT EXISTS idx_activity_skill ON student_activity(skill);
    CREATE TABLE IF NOT EXISTS student_mistakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL,
      kind TEXT NOT NULL,
      source TEXT NOT NULL,
      question TEXT NOT NULL,
      correctAnswer TEXT NOT NULL,
      studentAnswer TEXT,
      wordId TEXT,
      moduleNumber INTEGER,
      grade INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      nextDue TEXT,
      timesSeen INTEGER NOT NULL DEFAULT 1,
      timesCorrect INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mistakes_student ON student_mistakes(studentId, status);
    CREATE INDEX IF NOT EXISTS idx_mistakes_due ON student_mistakes(studentId, nextDue);
    CREATE TABLE IF NOT EXISTS student_badges (
      studentId TEXT NOT NULL,
      badgeId TEXT NOT NULL,
      unlockedAt TEXT NOT NULL,
      PRIMARY KEY (studentId, badgeId)
    );
    CREATE INDEX IF NOT EXISTS idx_badges_student ON student_badges(studentId);
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      createdAt TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'idea',
      userId TEXT,
      userRole TEXT,
      userName TEXT,
      pageUrl TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new'
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
    CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(createdAt);
    CREATE TABLE IF NOT EXISTS quiz_sessions (
      id TEXT PRIMARY KEY,
      pin TEXT NOT NULL UNIQUE,
      hostId TEXT NOT NULL,
      classId TEXT,
      grade INTEGER NOT NULL,
      title TEXT NOT NULL,
      questions TEXT NOT NULL,
      currentIdx INTEGER NOT NULL DEFAULT -1,
      questionStartedAt TEXT,
      status TEXT NOT NULL DEFAULT 'lobby',
      createdAt TEXT NOT NULL,
      finishedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_sessions_host ON quiz_sessions(hostId);
    CREATE INDEX IF NOT EXISTS idx_quiz_sessions_pin ON quiz_sessions(pin);
    CREATE TABLE IF NOT EXISTS quiz_players (
      sessionId TEXT NOT NULL,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      joinedAt TEXT NOT NULL,
      PRIMARY KEY (sessionId, userId)
    );
    CREATE TABLE IF NOT EXISTS quiz_answers (
      sessionId TEXT NOT NULL,
      userId TEXT NOT NULL,
      qIdx INTEGER NOT NULL,
      answer TEXT NOT NULL,
      isCorrect INTEGER NOT NULL,
      timeMs INTEGER NOT NULL,
      points INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (sessionId, userId, qIdx)
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON quiz_answers(sessionId);
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      userAgent TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(userId);
    CREATE TABLE IF NOT EXISTS photo_homework (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      classId TEXT,
      homeworkId TEXT,
      title TEXT,
      comment TEXT,
      imageData TEXT NOT NULL,
      mime TEXT NOT NULL,
      ocrText TEXT,
      aiFeedback TEXT,
      aiSuggestedGrade INTEGER,
      teacherGrade INTEGER,
      teacherComment TEXT,
      status TEXT NOT NULL DEFAULT 'submitted',
      createdAt TEXT NOT NULL,
      gradedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_photo_hw_student ON photo_homework(studentId);
    CREATE INDEX IF NOT EXISTS idx_photo_hw_class ON photo_homework(classId);
    CREATE TABLE IF NOT EXISTS story_progress (
      studentId TEXT NOT NULL,
      storyId TEXT NOT NULL,
      sceneIndex INTEGER NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      finishedAt TEXT,
      updatedAt TEXT NOT NULL,
      PRIMARY KEY (studentId, storyId)
    );
    CREATE INDEX IF NOT EXISTS idx_story_progress_student ON story_progress(studentId);
    CREATE TABLE IF NOT EXISTS user_cosmetics (
      userId TEXT PRIMARY KEY,
      avatarId TEXT,
      frameId TEXT,
      titleId TEXT,
      updatedAt TEXT NOT NULL
    );
  `);
  // Lightweight migrations — add engine/azure columns if an older DB predates them.
  const pronCols = db
    .prepare(`PRAGMA table_info(pronunciation_attempts)`)
    .all() as { name: string }[];
  const pronColNames = new Set(pronCols.map((c) => c.name));
  if (!pronColNames.has("engine")) {
    db.exec(`ALTER TABLE pronunciation_attempts ADD COLUMN engine TEXT`);
  }
  if (!pronColNames.has("azure")) {
    db.exec(`ALTER TABLE pronunciation_attempts ADD COLUMN azure TEXT`);
  }
  const hwCols = db.prepare(`PRAGMA table_info(homework)`).all() as { name: string }[];
  const hwColNames = new Set(hwCols.map((c) => c.name));
  if (!hwColNames.has("groupId")) {
    db.exec(`ALTER TABLE homework ADD COLUMN groupId TEXT`);
  }
  _db = db;
  return db;
}

// ───────────────── Users / Auth ─────────────────
export type UserRole = "teacher" | "student" | "parent";

export type UserRecord = {
  id: string;
  email: string | null;
  emailVerified: string | null;
  passwordHash: string | null;
  name: string | null;
  image: string | null;
  role: UserRole;
  grade: number | null;
  studentId: string | null;
  provider: string | null;
  providerAccountId: string | null;
  createdAt: string;
};

export function findUserByEmail(email: string): UserRecord | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM users WHERE email = ? COLLATE NOCASE LIMIT 1`)
    .get(email.trim().toLowerCase()) as UserRecord | undefined;
  return row ?? null;
}

export function findUserById(id: string): UserRecord | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).get(id) as
    | UserRecord
    | undefined;
  return row ?? null;
}

export function upsertUser(u: UserRecord): UserRecord {
  const db = getDb();
  db.prepare(
    `INSERT INTO users (id,email,emailVerified,passwordHash,name,image,role,grade,studentId,provider,providerAccountId,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       email=excluded.email,
       emailVerified=excluded.emailVerified,
       passwordHash=COALESCE(excluded.passwordHash, users.passwordHash),
       name=excluded.name,
       image=excluded.image,
       role=excluded.role,
       grade=excluded.grade,
       studentId=excluded.studentId,
       provider=excluded.provider,
       providerAccountId=excluded.providerAccountId`,
  ).run(
    u.id,
    u.email,
    u.emailVerified,
    u.passwordHash,
    u.name,
    u.image,
    u.role,
    u.grade,
    u.studentId,
    u.provider,
    u.providerAccountId,
    u.createdAt,
  );
  return u;
}

// ───────────────── Groups / Classes ─────────────────
export type GroupRecord = {
  id: string;
  name: string;
  grade: number;
  teacherId: string;
  joinCode: string;
  createdAt: string;
};

export type GroupMember = {
  groupId: string;
  userId: string;
  role: "teacher" | "student";
  joinedAt: string;
};

export type GroupWithCount = GroupRecord & { memberCount: number };

export function createGroup(g: GroupRecord) {
  const db = getDb();
  db.prepare(
    `INSERT INTO groups (id,name,grade,teacherId,joinCode,createdAt)
     VALUES (?,?,?,?,?,?)`,
  ).run(g.id, g.name, g.grade, g.teacherId, g.joinCode, g.createdAt);
  db.prepare(
    `INSERT OR IGNORE INTO group_members (groupId,userId,role,joinedAt) VALUES (?,?,?,?)`,
  ).run(g.id, g.teacherId, "teacher", g.createdAt);
}

export function groupsByTeacher(teacherId: string): GroupWithCount[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT g.*, (SELECT COUNT(*) FROM group_members m WHERE m.groupId = g.id AND m.role = 'student') AS memberCount
       FROM groups g WHERE g.teacherId = ? ORDER BY g.createdAt DESC`,
    )
    .all(teacherId) as GroupWithCount[];
}

export function groupsByUser(userId: string): GroupWithCount[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT g.*, (SELECT COUNT(*) FROM group_members m2 WHERE m2.groupId = g.id AND m2.role = 'student') AS memberCount
       FROM groups g
       INNER JOIN group_members m ON m.groupId = g.id
       WHERE m.userId = ?
       ORDER BY g.createdAt DESC`,
    )
    .all(userId) as GroupWithCount[];
}

export function groupByJoinCode(code: string): GroupRecord | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM groups WHERE joinCode = ? LIMIT 1`)
    .get(code.trim().toUpperCase()) as GroupRecord | undefined;
  return row ?? null;
}

export function groupMembers(groupId: string): (GroupMember & { user: UserRecord | null })[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.groupId, m.userId, m.role, m.joinedAt,
              u.id AS u_id, u.email AS u_email, u.name AS u_name, u.image AS u_image,
              u.role AS u_role, u.grade AS u_grade, u.studentId AS u_studentId
       FROM group_members m LEFT JOIN users u ON u.id = m.userId
       WHERE m.groupId = ?
       ORDER BY m.joinedAt DESC`,
    )
    .all(groupId) as Array<{
      groupId: string;
      userId: string;
      role: "teacher" | "student";
      joinedAt: string;
      u_id: string | null;
      u_email: string | null;
      u_name: string | null;
      u_image: string | null;
      u_role: "teacher" | "student" | null;
      u_grade: number | null;
      u_studentId: string | null;
    }>;
  return rows.map((r) => ({
    groupId: r.groupId,
    userId: r.userId,
    role: r.role,
    joinedAt: r.joinedAt,
    user: r.u_id
      ? {
          id: r.u_id,
          email: r.u_email,
          emailVerified: null,
          passwordHash: null,
          name: r.u_name,
          image: r.u_image,
          role: (r.u_role ?? "student") as "teacher" | "student",
          grade: r.u_grade,
          studentId: r.u_studentId,
          provider: null,
          providerAccountId: null,
          createdAt: "",
        }
      : null,
  }));
}

export function addGroupMember(groupId: string, userId: string, role: "teacher" | "student" = "student") {
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO group_members (groupId,userId,role,joinedAt) VALUES (?,?,?,?)`,
  ).run(groupId, userId, role, new Date().toISOString());
}

export function removeGroupMember(groupId: string, userId: string) {
  const db = getDb();
  db.prepare(`DELETE FROM group_members WHERE groupId = ? AND userId = ?`).run(groupId, userId);
}

export function getGroup(id: string): GroupRecord | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM groups WHERE id = ? LIMIT 1`).get(id) as
    | GroupRecord
    | undefined;
  return row ?? null;
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

export type JournalLesson = {
  id: string;
  grade: number;
  date: string;
  topic: string;
  module: number;
  createdAt: string;
};

export type Attendance = "present" | "absent" | "late" | "excused";

export type JournalEntry = {
  id: string;
  lessonId: string;
  studentId: string;
  mark: string | null;
  attendance: Attendance;
  comment: string | null;
  updatedAt: string;
};

export function listLessons(grade: number): JournalLesson[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM journal_lessons WHERE grade = ? ORDER BY date ASC`)
    .all(grade) as JournalLesson[];
}

export function upsertLesson(lesson: JournalLesson) {
  const db = getDb();
  db.prepare(
    `INSERT INTO journal_lessons (id,grade,date,topic,module,createdAt)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       date=excluded.date, topic=excluded.topic, module=excluded.module, grade=excluded.grade`,
  ).run(lesson.id, lesson.grade, lesson.date, lesson.topic, lesson.module, lesson.createdAt);
}

export function deleteLesson(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM journal_entries WHERE lessonId = ?`).run(id);
  db.prepare(`DELETE FROM journal_lessons WHERE id = ?`).run(id);
}

export function listEntries(lessonIds: string[]): JournalEntry[] {
  if (!lessonIds.length) return [];
  const db = getDb();
  const placeholders = lessonIds.map(() => "?").join(",");
  return db
    .prepare(`SELECT * FROM journal_entries WHERE lessonId IN (${placeholders})`)
    .all(...lessonIds) as JournalEntry[];
}

export function entriesForStudent(studentId: string): (JournalEntry & { lesson: JournalLesson })[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT e.*, l.grade AS l_grade, l.date AS l_date, l.topic AS l_topic, l.module AS l_module, l.createdAt AS l_createdAt
       FROM journal_entries e
       JOIN journal_lessons l ON l.id = e.lessonId
       WHERE e.studentId = ?
       ORDER BY l.date DESC`,
    )
    .all(studentId)
    .map((r) => {
      const row = r as JournalEntry & {
        l_grade: number;
        l_date: string;
        l_topic: string;
        l_module: number;
        l_createdAt: string;
      };
      return {
        id: row.id,
        lessonId: row.lessonId,
        studentId: row.studentId,
        mark: row.mark,
        attendance: row.attendance,
        comment: row.comment,
        updatedAt: row.updatedAt,
        lesson: {
          id: row.lessonId,
          grade: row.l_grade,
          date: row.l_date,
          topic: row.l_topic,
          module: row.l_module,
          createdAt: row.l_createdAt,
        },
      };
    });
}

export function upsertEntry(entry: JournalEntry) {
  const db = getDb();
  db.prepare(
    `INSERT INTO journal_entries (id,lessonId,studentId,mark,attendance,comment,updatedAt)
     VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(lessonId, studentId) DO UPDATE SET
       mark=excluded.mark, attendance=excluded.attendance, comment=excluded.comment, updatedAt=excluded.updatedAt`,
  ).run(
    entry.id,
    entry.lessonId,
    entry.studentId,
    entry.mark,
    entry.attendance,
    entry.comment,
    entry.updatedAt,
  );
}

export type BoardNote = {
  id: string;
  title: string;
  data: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
};

export function listBoardNotes(): BoardNote[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM board_notes ORDER BY updatedAt DESC LIMIT 50`)
    .all() as BoardNote[];
}

export function getBoardNote(id: string): BoardNote | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM board_notes WHERE id = ?`).get(id) as BoardNote | undefined;
}

export function upsertBoardNote(note: BoardNote) {
  const db = getDb();
  db.prepare(
    `INSERT INTO board_notes (id,title,data,thumbnail,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title, data=excluded.data, thumbnail=excluded.thumbnail, updatedAt=excluded.updatedAt`,
  ).run(note.id, note.title, note.data, note.thumbnail, note.createdAt, note.updatedAt);
}

export function deleteBoardNote(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM board_notes WHERE id = ?`).run(id);
}

export type Homework = {
  id: string;
  grade: number;
  title: string;
  instructions: string | null;
  resourceType: "reading" | "dialogue" | "exercise" | "text" | "link";
  resourceId: string | null;
  resourcePayload: string | null;
  dueDate: string | null;
  createdAt: string;
  groupId: string | null;
};

export type HomeworkCompletion = {
  homeworkId: string;
  studentId: string;
  status: string;
  completedAt: string;
};

export function listHomework(grade?: number, userId?: string): Homework[] {
  const db = getDb();
  if (typeof grade === "number" && userId) {
    // Grade match AND (no groupId OR student is in groupId)
    return db
      .prepare(
        `SELECT h.* FROM homework h
         WHERE h.grade = ?
           AND (h.groupId IS NULL OR EXISTS (
             SELECT 1 FROM group_members m WHERE m.groupId = h.groupId AND m.userId = ?
           ))
         ORDER BY h.createdAt DESC`,
      )
      .all(grade, userId) as Homework[];
  }
  if (typeof grade === "number") {
    return db
      .prepare(`SELECT * FROM homework WHERE grade = ? ORDER BY createdAt DESC`)
      .all(grade) as Homework[];
  }
  return db.prepare(`SELECT * FROM homework ORDER BY createdAt DESC`).all() as Homework[];
}

export function insertHomework(h: Homework) {
  const db = getDb();
  db.prepare(
    `INSERT INTO homework (id,grade,title,instructions,resourceType,resourceId,resourcePayload,dueDate,createdAt,groupId)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    h.id,
    h.grade,
    h.title,
    h.instructions,
    h.resourceType,
    h.resourceId,
    h.resourcePayload,
    h.dueDate,
    h.createdAt,
    h.groupId,
  );
}

export function deleteHomework(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM homework_completions WHERE homeworkId = ?`).run(id);
  db.prepare(`DELETE FROM homework WHERE id = ?`).run(id);
}

export function markHomeworkDone(homeworkId: string, studentId: string) {
  const db = getDb();
  db.prepare(
    `INSERT INTO homework_completions (homeworkId,studentId,status,completedAt)
     VALUES (?,?,?,?)
     ON CONFLICT(homeworkId, studentId) DO UPDATE SET
       status=excluded.status, completedAt=excluded.completedAt`,
  ).run(homeworkId, studentId, "done", new Date().toISOString());
}

export function unmarkHomework(homeworkId: string, studentId: string) {
  const db = getDb();
  db.prepare(
    `DELETE FROM homework_completions WHERE homeworkId = ? AND studentId = ?`,
  ).run(homeworkId, studentId);
}

export function completionsForStudent(studentId: string): HomeworkCompletion[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM homework_completions WHERE studentId = ?`)
    .all(studentId) as HomeworkCompletion[];
}

export function completionsForHomework(homeworkId: string): HomeworkCompletion[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM homework_completions WHERE homeworkId = ?`)
    .all(homeworkId) as HomeworkCompletion[];
}

export type AzurePronWordStored = {
  word: string;
  accuracyScore: number;
  errorType: string;
};

export type AzurePronStored = {
  accuracy: number;
  fluency: number;
  completeness: number;
  pronScore: number;
  words: AzurePronWordStored[];
};

export type PronAttempt = {
  studentId: string;
  grade: number;
  category: "word" | "sentence" | "dialogue";
  expected: string;
  transcript: string;
  score: number;
  stars: number;
  missedWords: string[];
  createdAt: string;
  engine?: "web-speech" | "azure" | null;
  azure?: AzurePronStored | null;
};

export function insertPronAttempt(a: PronAttempt) {
  const db = getDb();
  db.prepare(
    `INSERT INTO pronunciation_attempts
      (studentId,grade,category,expected,transcript,score,stars,missedWords,createdAt,engine,azure)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    a.studentId,
    a.grade,
    a.category,
    a.expected,
    a.transcript,
    a.score,
    a.stars,
    JSON.stringify(a.missedWords),
    a.createdAt,
    a.engine ?? null,
    a.azure ? JSON.stringify(a.azure) : null,
  );
}

export function pronAttemptsByGrade(grade: number, limit = 500): PronAttempt[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM pronunciation_attempts WHERE grade = ? ORDER BY createdAt DESC LIMIT ?`,
    )
    .all(grade, limit) as (Omit<PronAttempt, "missedWords" | "azure"> & {
      missedWords: string;
      azure: string | null;
    })[];
  return rows.map((r) => ({
    ...r,
    missedWords: safeJsonArray(r.missedWords),
    azure: r.azure ? (safeJsonObject(r.azure) as AzurePronStored | null) : null,
  }));
}

function safeJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function safeJsonObject(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
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

  const topics = [
    "School Days · Повторение",
    "Family Ties · Диалоги",
    "Going Places · Словарь",
    "Holidays · Грамматика",
    "Module Test",
  ];
  const gradesPresent = Array.from(new Set(demo.map((d) => d.grade)));
  for (const g of gradesPresent) {
    const cohort = demo.filter((d) => d.grade === g);
    const lessonIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const lid = `seed-lesson-g${g}-${i}`;
      lessonIds.push(lid);
      upsertLesson({
        id: lid,
        grade: g,
        date: new Date(now - (5 - i) * 86400000).toISOString().slice(0, 10),
        topic: topics[i],
        module: cohort[0]?.currentModule ?? 1,
        createdAt: new Date(now - (5 - i) * 86400000).toISOString(),
      });
    }
    for (const s of cohort) {
      for (let i = 0; i < lessonIds.length; i++) {
        const r = ((s.id.charCodeAt(5) * 17 + i * 7) % 10) / 10;
        const attendance: Attendance = r < 0.82 ? "present" : r < 0.9 ? "late" : r < 0.95 ? "excused" : "absent";
        const mark = attendance === "absent" ? null : ["3", "4", "5", "5", "4"][Math.floor(r * 5)] ?? "4";
        upsertEntry({
          id: `seed-entry-${s.id}-${i}`,
          lessonId: lessonIds[i],
          studentId: s.id,
          mark,
          attendance,
          comment: i === 2 && s.id === "demo-anya" ? "Активная работа у доски" : null,
          updatedAt: new Date(now - (5 - i) * 86400000).toISOString(),
        });
      }
    }
  }
}
