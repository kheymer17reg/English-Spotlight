import "server-only";
import { getDb } from "@/lib/db";

export type FeedPostKind =
  | "lesson_done"
  | "badge_unlocked"
  | "streak_milestone"
  | "level_up"
  | "perfect_score"
  | "vocab_milestone"
  | "teacher_note";

export type FeedReactionEmoji = "👍" | "🔥" | "💪" | "⭐" | "🎉";

export const REACTION_EMOJIS: FeedReactionEmoji[] = ["👍", "🔥", "💪", "⭐", "🎉"];

export interface FeedPostRecord {
  id: number;
  classId: string;
  authorId: string;
  authorName: string;
  authorGrade: number | null;
  kind: FeedPostKind;
  payload: Record<string, unknown>;
  createdAt: string;
  reactions: { emoji: FeedReactionEmoji; count: number; mine: boolean }[];
}

let migrated = false;
function ensureMigrated() {
  if (migrated) return;
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS feed_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      classId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      kind TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_feed_posts_class ON feed_posts(classId, id DESC);
    CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON feed_posts(authorId);
    CREATE TABLE IF NOT EXISTS feed_reactions (
      postId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      emoji TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (postId, userId, emoji),
      FOREIGN KEY (postId) REFERENCES feed_posts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_feed_reactions_post ON feed_reactions(postId);
  `);
  migrated = true;
}

interface PostRow {
  id: number;
  classId: string;
  authorId: string;
  kind: string;
  payload: string;
  createdAt: string;
}

interface AuthorRow {
  id: string;
  name: string;
  grade: number;
}

interface ReactionAggRow {
  postId: number;
  emoji: string;
  count: number;
}

interface ReactionMineRow {
  postId: number;
  emoji: string;
}

export interface CreatePostInput {
  classId: string;
  authorId: string;
  kind: FeedPostKind;
  payload?: Record<string, unknown>;
}

export function createPost(input: CreatePostInput): number {
  ensureMigrated();
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO feed_posts (classId, authorId, kind, payload, createdAt) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      input.classId,
      input.authorId,
      input.kind,
      JSON.stringify(input.payload ?? {}),
      now,
    );
  return Number(info.lastInsertRowid);
}

/**
 * Auto-post helper: creates a feed entry in every class the author belongs to.
 * `authorStudentId` is the row id from the `students` table (same id used in
 * student_activity); we join through `users.studentId` to find the user's class
 * memberships.
 */
export function autoPostToAuthorClasses(
  authorStudentId: string,
  kind: FeedPostKind,
  payload: Record<string, unknown> = {},
): number[] {
  ensureMigrated();
  const db = getDb();
  const classes = db
    .prepare(
      `SELECT m.groupId
         FROM group_members m
         JOIN users u ON u.id = m.userId
        WHERE u.studentId = ? AND m.role = 'student'`,
    )
    .all(authorStudentId) as { groupId: string }[];
  const ids: number[] = [];
  for (const c of classes) {
    ids.push(createPost({ classId: c.groupId, authorId: authorStudentId, kind, payload }));
  }
  return ids;
}

/** Cooldown: avoid spamming feed when student does many small things in a row. */
export function recentSimilarPostExists(
  authorId: string,
  kind: FeedPostKind,
  withinSeconds = 60 * 60,
): boolean {
  ensureMigrated();
  const db = getDb();
  const since = new Date(Date.now() - withinSeconds * 1000).toISOString();
  const row = db
    .prepare(
      `SELECT id FROM feed_posts WHERE authorId = ? AND kind = ? AND createdAt >= ? LIMIT 1`,
    )
    .get(authorId, kind, since) as { id: number } | undefined;
  return Boolean(row);
}

export function listClassFeed(
  classId: string,
  viewerUserId: string,
  limit = 30,
): FeedPostRecord[] {
  ensureMigrated();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, classId, authorId, kind, payload, createdAt
         FROM feed_posts
        WHERE classId = ?
        ORDER BY id DESC
        LIMIT ?`,
    )
    .all(classId, limit) as PostRow[];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const authorIds = Array.from(new Set(rows.map((r) => r.authorId)));
  const authorPlaceholders = authorIds.map(() => "?").join(",");
  const authors = db
    .prepare(
      `SELECT id, name, grade FROM students WHERE id IN (${authorPlaceholders})`,
    )
    .all(...authorIds) as AuthorRow[];
  const authorMap = new Map(authors.map((a) => [a.id, a] as const));
  const aggRows = db
    .prepare(
      `SELECT postId, emoji, COUNT(*) AS count
         FROM feed_reactions
        WHERE postId IN (${placeholders})
        GROUP BY postId, emoji`,
    )
    .all(...ids) as ReactionAggRow[];
  const aggByPost = new Map<number, Map<string, number>>();
  for (const agg of aggRows) {
    let inner = aggByPost.get(agg.postId);
    if (!inner) {
      inner = new Map();
      aggByPost.set(agg.postId, inner);
    }
    inner.set(agg.emoji, agg.count);
  }
  const mineRows = db
    .prepare(
      `SELECT postId, emoji FROM feed_reactions WHERE postId IN (${placeholders}) AND userId = ?`,
    )
    .all(...ids, viewerUserId) as ReactionMineRow[];
  const mineByPost = new Map<number, Set<string>>();
  for (const m of mineRows) {
    let inner = mineByPost.get(m.postId);
    if (!inner) {
      inner = new Set();
      mineByPost.set(m.postId, inner);
    }
    inner.add(m.emoji);
  }
  return rows.map((r) => {
    const counts = aggByPost.get(r.id) ?? new Map<string, number>();
    const mine = mineByPost.get(r.id) ?? new Set<string>();
    const reactions = REACTION_EMOJIS.map((emoji) => ({
      emoji,
      count: counts.get(emoji) ?? 0,
      mine: mine.has(emoji),
    }));
    const author = authorMap.get(r.authorId);
    const payload = safeParse(r.payload);
    return {
      id: r.id,
      classId: r.classId,
      authorId: r.authorId,
      authorName: author?.name ?? "Ученик",
      authorGrade: author?.grade ?? null,
      kind: r.kind as FeedPostKind,
      payload,
      createdAt: r.createdAt,
      reactions,
    };
  });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s) as unknown;
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function toggleReaction(
  postId: number,
  userId: string,
  emoji: string,
): { added: boolean } {
  ensureMigrated();
  const db = getDb();
  const existing = db
    .prepare(
      `SELECT 1 FROM feed_reactions WHERE postId = ? AND userId = ? AND emoji = ?`,
    )
    .get(postId, userId, emoji);
  if (existing) {
    db.prepare(
      `DELETE FROM feed_reactions WHERE postId = ? AND userId = ? AND emoji = ?`,
    ).run(postId, userId, emoji);
    return { added: false };
  }
  db.prepare(
    `INSERT INTO feed_reactions (postId, userId, emoji, createdAt) VALUES (?, ?, ?, ?)`,
  ).run(postId, userId, emoji, new Date().toISOString());
  return { added: true };
}

export function deletePost(postId: number, userId: string): boolean {
  ensureMigrated();
  const db = getDb();
  const row = db
    .prepare(`SELECT authorId FROM feed_posts WHERE id = ?`)
    .get(postId) as { authorId: string } | undefined;
  if (!row || row.authorId !== userId) return false;
  db.prepare(`DELETE FROM feed_reactions WHERE postId = ?`).run(postId);
  db.prepare(`DELETE FROM feed_posts WHERE id = ?`).run(postId);
  return true;
}
