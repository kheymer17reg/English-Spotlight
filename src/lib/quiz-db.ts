import "server-only";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { vocabularyByGrade } from "@/lib/vocabulary";
import type { Grade } from "@/types";

export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: string;
};

export type QuizStatus = "lobby" | "active" | "finished";

export type QuizSessionRow = {
  id: string;
  pin: string;
  hostId: string;
  classId: string | null;
  grade: number;
  title: string;
  questions: string; // JSON
  currentIdx: number;
  questionStartedAt: string | null;
  status: QuizStatus;
  createdAt: string;
  finishedAt: string | null;
};

export type QuizPlayerRow = {
  sessionId: string;
  userId: string;
  name: string;
  score: number;
  joinedAt: string;
};

export type QuizAnswerRow = {
  sessionId: string;
  userId: string;
  qIdx: number;
  answer: string;
  isCorrect: number;
  timeMs: number;
  points: number;
  createdAt: string;
};

const QUESTION_DURATION_MS = 25_000;
const MAX_POINTS = 1000;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateVocabQuestions(grade: Grade, n: number): QuizQuestion[] {
  const pool = vocabularyByGrade(grade);
  if (pool.length < 4) return [];
  const picks = shuffle(pool).slice(0, Math.min(n, pool.length));
  return picks.map((w) => {
    const distractors = shuffle(pool.filter((x) => x.id !== w.id))
      .slice(0, 3)
      .map((x) => x.translation);
    return {
      prompt: w.word,
      options: shuffle([w.translation, ...distractors]),
      answer: w.translation,
    };
  });
}

function freshPin(): string {
  const db = getDb();
  for (let i = 0; i < 8; i++) {
    const pin = String(100000 + Math.floor(Math.random() * 900000));
    const existing = db
      .prepare(`SELECT 1 FROM quiz_sessions WHERE pin = ? AND status != 'finished' LIMIT 1`)
      .get(pin);
    if (!existing) return pin;
  }
  return String(Date.now()).slice(-6);
}

export function createSession(input: {
  hostId: string;
  classId: string | null;
  grade: Grade;
  title: string;
  questions: QuizQuestion[];
}): QuizSessionRow {
  const db = getDb();
  const id = randomUUID();
  const pin = freshPin();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO quiz_sessions (id,pin,hostId,classId,grade,title,questions,currentIdx,status,createdAt)
     VALUES (?,?,?,?,?,?,?,-1,'lobby',?)`,
  ).run(id, pin, input.hostId, input.classId, input.grade, input.title, JSON.stringify(input.questions), now);
  return getSession(id)!;
}

export function getSession(id: string): QuizSessionRow | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM quiz_sessions WHERE id = ? LIMIT 1`).get(id) as
    | QuizSessionRow
    | undefined;
  return row ?? null;
}

export function getSessionByPin(pin: string): QuizSessionRow | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM quiz_sessions WHERE pin = ? AND status != 'finished' ORDER BY createdAt DESC LIMIT 1`)
    .get(pin) as QuizSessionRow | undefined;
  return row ?? null;
}

export function listHostSessions(hostId: string, limit = 10): QuizSessionRow[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM quiz_sessions WHERE hostId = ? ORDER BY createdAt DESC LIMIT ?`)
    .all(hostId, limit) as QuizSessionRow[];
}

export function addPlayer(sessionId: string, userId: string, name: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO quiz_players (sessionId,userId,name,score,joinedAt) VALUES (?,?,?,0,?)`,
  ).run(sessionId, userId, name, now);
}

export function listPlayers(sessionId: string): QuizPlayerRow[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM quiz_players WHERE sessionId = ? ORDER BY score DESC, joinedAt ASC`)
    .all(sessionId) as QuizPlayerRow[];
}

export function setStatus(id: string, status: QuizStatus): void {
  const db = getDb();
  if (status === "finished") {
    db.prepare(`UPDATE quiz_sessions SET status = ?, finishedAt = ? WHERE id = ?`).run(
      status,
      new Date().toISOString(),
      id,
    );
  } else {
    db.prepare(`UPDATE quiz_sessions SET status = ? WHERE id = ?`).run(status, id);
  }
}

export function advanceQuestion(id: string): { idx: number; finished: boolean } {
  const db = getDb();
  const s = getSession(id);
  if (!s) return { idx: -1, finished: true };
  const list = JSON.parse(s.questions) as QuizQuestion[];
  const next = s.currentIdx + 1;
  if (next >= list.length) {
    setStatus(id, "finished");
    return { idx: s.currentIdx, finished: true };
  }
  db.prepare(`UPDATE quiz_sessions SET currentIdx = ?, questionStartedAt = ?, status = 'active' WHERE id = ?`).run(
    next,
    new Date().toISOString(),
    id,
  );
  return { idx: next, finished: false };
}

export function recordAnswer(input: {
  sessionId: string;
  userId: string;
  qIdx: number;
  answer: string;
}): { isCorrect: boolean; points: number; timeMs: number } | null {
  const db = getDb();
  const s = getSession(input.sessionId);
  if (!s || s.currentIdx !== input.qIdx || !s.questionStartedAt) return null;
  const list = JSON.parse(s.questions) as QuizQuestion[];
  const q = list[input.qIdx];
  if (!q) return null;
  const startedAt = new Date(s.questionStartedAt).getTime();
  const timeMs = Math.max(0, Date.now() - startedAt);
  if (timeMs > QUESTION_DURATION_MS + 2000) return null;
  const isCorrect = q.answer === input.answer;
  const speedFactor = Math.max(0, 1 - timeMs / QUESTION_DURATION_MS);
  const points = isCorrect ? Math.round(MAX_POINTS * (0.5 + 0.5 * speedFactor)) : 0;
  const existing = db
    .prepare(`SELECT 1 FROM quiz_answers WHERE sessionId = ? AND userId = ? AND qIdx = ?`)
    .get(input.sessionId, input.userId, input.qIdx);
  if (existing) return null;
  db.prepare(
    `INSERT INTO quiz_answers (sessionId,userId,qIdx,answer,isCorrect,timeMs,points,createdAt)
     VALUES (?,?,?,?,?,?,?,?)`,
  ).run(
    input.sessionId,
    input.userId,
    input.qIdx,
    input.answer,
    isCorrect ? 1 : 0,
    timeMs,
    points,
    new Date().toISOString(),
  );
  if (points > 0) {
    db.prepare(`UPDATE quiz_players SET score = score + ? WHERE sessionId = ? AND userId = ?`).run(
      points,
      input.sessionId,
      input.userId,
    );
  }
  return { isCorrect, points, timeMs };
}

export function answeredCount(sessionId: string, qIdx: number): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT COUNT(*) AS c FROM quiz_answers WHERE sessionId = ? AND qIdx = ?`)
    .get(sessionId, qIdx) as { c: number };
  return row.c;
}

export function questionStats(sessionId: string, qIdx: number): { option: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(`SELECT answer AS option, COUNT(*) AS count FROM quiz_answers WHERE sessionId = ? AND qIdx = ? GROUP BY answer`)
    .all(sessionId, qIdx) as { option: string; count: number }[];
}

export function questionDurationMs(): number {
  return QUESTION_DURATION_MS;
}

export function decodeQuestions(raw: string): QuizQuestion[] {
  try {
    return JSON.parse(raw) as QuizQuestion[];
  } catch {
    return [];
  }
}
