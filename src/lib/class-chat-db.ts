import "server-only";
import { getDb } from "@/lib/db";
import { publishClassChat } from "@/lib/class-chat-bus";

/**
 * Class-wide chat: one channel per class, anyone in the class can post.
 * Lumos runs after each student message and stores a tiny JSON correction
 * (same shape as the pair-roleplay moderator). Teacher messages are stored
 * with `correction = null` (no auto-correction for adults).
 *
 * Storage is intentionally lightweight: SQLite, last 200 messages per class
 * fetched at hydration, then the page subscribes to SSE deltas.
 */

let migrated = false;
function ensureMigrated() {
  if (migrated) return;
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS class_chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      classId TEXT NOT NULL,
      authorUserId TEXT NOT NULL,
      text TEXT NOT NULL,
      correction TEXT,
      authorRole TEXT NOT NULL DEFAULT 'student',
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_class_chat_class ON class_chat_messages(classId, id DESC);
  `);
  migrated = true;
}

export type ChatAuthorRole = "student" | "teacher";

export interface ChatMessageRow {
  id: number;
  classId: string;
  authorUserId: string;
  text: string;
  correction: string | null;
  authorRole: ChatAuthorRole;
  createdAt: string;
}

export interface ChatMessageView extends ChatMessageRow {
  authorName: string;
}

export interface AppendChatInput {
  classId: string;
  authorUserId: string;
  authorRole: ChatAuthorRole;
  text: string;
  correction: Record<string, unknown> | null;
}

export function appendChatMessage(input: AppendChatInput): ChatMessageRow {
  ensureMigrated();
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO class_chat_messages
         (classId, authorUserId, text, correction, authorRole, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.classId,
      input.authorUserId,
      input.text,
      input.correction ? JSON.stringify(input.correction) : null,
      input.authorRole,
      now,
    );
  const id = Number(info.lastInsertRowid);
  publishClassChat(input.classId, {
    type: "chat.message",
    classId: input.classId,
    messageId: id,
  });
  return {
    id,
    classId: input.classId,
    authorUserId: input.authorUserId,
    text: input.text,
    correction: input.correction ? JSON.stringify(input.correction) : null,
    authorRole: input.authorRole,
    createdAt: now,
  };
}

export function listChat(
  classId: string,
  limit = 200,
  beforeId?: number,
): ChatMessageView[] {
  ensureMigrated();
  const db = getDb();
  const rows = beforeId
    ? (db
        .prepare(
          `SELECT * FROM class_chat_messages
            WHERE classId = ? AND id < ?
            ORDER BY id DESC LIMIT ?`,
        )
        .all(classId, beforeId, limit) as ChatMessageRow[])
    : (db
        .prepare(
          `SELECT * FROM class_chat_messages
            WHERE classId = ?
            ORDER BY id DESC LIMIT ?`,
        )
        .all(classId, limit) as ChatMessageRow[]);
  if (!rows.length) return [];
  const ids = Array.from(new Set(rows.map((r) => r.authorUserId)));
  const placeholders = ids.map(() => "?").join(",");
  const names = db
    .prepare(`SELECT id, name FROM users WHERE id IN (${placeholders})`)
    .all(...ids) as { id: string; name: string | null }[];
  const nameMap = new Map(names.map((n) => [n.id, n.name ?? "Ученик"] as const));
  return rows
    .reverse()
    .map((r) => ({
      ...r,
      authorName: nameMap.get(r.authorUserId) ?? "Участник",
    }));
}

export function deleteChatMessage(messageId: number, requesterUserId: string): boolean {
  ensureMigrated();
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, classId, authorUserId FROM class_chat_messages WHERE id = ?`,
    )
    .get(messageId) as
    | { id: number; classId: string; authorUserId: string }
    | undefined;
  if (!row) return false;
  // Author can delete own message; teachers in the class can delete any.
  if (row.authorUserId !== requesterUserId) {
    const isTeacher = db
      .prepare(
        `SELECT 1 FROM group_members WHERE groupId = ? AND userId = ? AND role = 'teacher' LIMIT 1`,
      )
      .get(row.classId, requesterUserId) as { 1?: number } | undefined;
    if (!isTeacher) return false;
  }
  db.prepare(`DELETE FROM class_chat_messages WHERE id = ?`).run(messageId);
  publishClassChat(row.classId, {
    type: "chat.deleted",
    classId: row.classId,
    messageId,
  });
  return true;
}
