import "server-only";
import { getDb } from "@/lib/db";

/**
 * Pair roleplay: two students take turns inside a shared room (e.g. shop
 * assistant ↔ customer). The Lumos AI moderator runs after each turn to give
 * a non-blocking correction (kept tiny so the live conversation flows).
 *
 * Rooms are short-lived: created with a 5-character join code, expire after
 * 24h, max 30 messages each. We keep everything in SQLite — turn-based pace
 * (~10s/turn) easily fits polling, no need for a websocket layer.
 */

let migrated = false;
function ensureMigrated() {
  if (migrated) return;
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pair_rooms (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      scenario TEXT NOT NULL,
      grade INTEGER NOT NULL,
      roleA TEXT NOT NULL,
      roleB TEXT NOT NULL,
      slotAUserId TEXT NOT NULL,
      slotBUserId TEXT,
      status TEXT NOT NULL DEFAULT 'waiting',
      currentTurn TEXT NOT NULL DEFAULT 'A',
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pair_rooms_code ON pair_rooms(code);
    CREATE TABLE IF NOT EXISTS pair_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roomId TEXT NOT NULL,
      slot TEXT NOT NULL,
      text TEXT NOT NULL,
      correction TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pair_messages_room ON pair_messages(roomId, id);
  `);
  migrated = true;
}

export type PairSlot = "A" | "B";
export type PairStatus = "waiting" | "active" | "done" | "expired";

export interface PairRoom {
  id: string;
  code: string;
  scenario: string;
  grade: number;
  roleA: string;
  roleB: string;
  slotAUserId: string;
  slotBUserId: string | null;
  status: PairStatus;
  currentTurn: PairSlot;
  createdAt: string;
  expiresAt: string;
}

export interface PairMessage {
  id: number;
  roomId: string;
  slot: PairSlot;
  text: string;
  /** JSON-serialized lumos correction; null while pending */
  correction: string | null;
  createdAt: string;
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 5): string {
  let s = "";
  for (let i = 0; i < len; i += 1) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return s;
}

export interface CreateRoomInput {
  scenario: string;
  grade: number;
  roleA: string;
  roleB: string;
  slotAUserId: string;
}

export function createRoom(input: CreateRoomInput): PairRoom {
  ensureMigrated();
  const db = getDb();
  // Expire in 24h.
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  // Generate a unique code with retries (collision is unlikely with 32^5 ≈ 33M).
  let code = "";
  for (let i = 0; i < 8; i += 1) {
    code = randomCode();
    const taken = db.prepare(`SELECT id FROM pair_rooms WHERE code = ?`).get(code);
    if (!taken) break;
    code = "";
  }
  if (!code) {
    throw new Error("could not allocate room code");
  }
  const id = `pr_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
  const room: PairRoom = {
    id,
    code,
    scenario: input.scenario,
    grade: input.grade,
    roleA: input.roleA,
    roleB: input.roleB,
    slotAUserId: input.slotAUserId,
    slotBUserId: null,
    status: "waiting",
    currentTurn: "A",
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
  db.prepare(
    `INSERT INTO pair_rooms (
       id, code, scenario, grade, roleA, roleB,
       slotAUserId, slotBUserId, status, currentTurn, createdAt, expiresAt
     ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'waiting', 'A', ?, ?)`,
  ).run(
    room.id,
    room.code,
    room.scenario,
    room.grade,
    room.roleA,
    room.roleB,
    room.slotAUserId,
    room.createdAt,
    room.expiresAt,
  );
  return room;
}

export function findRoomByCode(code: string): PairRoom | null {
  ensureMigrated();
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM pair_rooms WHERE code = ? LIMIT 1`)
    .get(code.trim().toUpperCase()) as PairRoom | undefined;
  return row ?? null;
}

export function findRoomById(id: string): PairRoom | null {
  ensureMigrated();
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM pair_rooms WHERE id = ? LIMIT 1`)
    .get(id) as PairRoom | undefined;
  return row ?? null;
}

export function joinRoomAsB(code: string, userId: string): PairRoom | null {
  ensureMigrated();
  const db = getDb();
  const room = findRoomByCode(code);
  if (!room) return null;
  if (room.slotAUserId === userId) {
    // Same user can't be both slots.
    return room;
  }
  if (room.slotBUserId && room.slotBUserId !== userId) {
    return null;
  }
  if (new Date(room.expiresAt).getTime() < Date.now()) {
    db.prepare(`UPDATE pair_rooms SET status = 'expired' WHERE id = ?`).run(room.id);
    return null;
  }
  db.prepare(
    `UPDATE pair_rooms SET slotBUserId = ?, status = 'active' WHERE id = ?`,
  ).run(userId, room.id);
  return findRoomById(room.id);
}

export function userSlotInRoom(room: PairRoom, userId: string): PairSlot | null {
  if (room.slotAUserId === userId) return "A";
  if (room.slotBUserId === userId) return "B";
  return null;
}

export function appendMessage(
  roomId: string,
  slot: PairSlot,
  text: string,
  correction: Record<string, unknown> | null,
): PairMessage {
  ensureMigrated();
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO pair_messages (roomId, slot, text, correction, createdAt) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(roomId, slot, text, correction ? JSON.stringify(correction) : null, now);
  // Flip turn.
  const next: PairSlot = slot === "A" ? "B" : "A";
  db.prepare(`UPDATE pair_rooms SET currentTurn = ? WHERE id = ?`).run(next, roomId);
  return {
    id: Number(info.lastInsertRowid),
    roomId,
    slot,
    text,
    correction: correction ? JSON.stringify(correction) : null,
    createdAt: now,
  };
}

export function listMessages(roomId: string): PairMessage[] {
  ensureMigrated();
  const db = getDb();
  return db
    .prepare(`SELECT * FROM pair_messages WHERE roomId = ? ORDER BY id ASC`)
    .all(roomId) as PairMessage[];
}

export function setRoomStatus(roomId: string, status: PairStatus): void {
  ensureMigrated();
  const db = getDb();
  db.prepare(`UPDATE pair_rooms SET status = ? WHERE id = ?`).run(status, roomId);
}

export function recentRoomsForUser(userId: string, limit = 5): PairRoom[] {
  ensureMigrated();
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM pair_rooms
        WHERE slotAUserId = ? OR slotBUserId = ?
        ORDER BY createdAt DESC LIMIT ?`,
    )
    .all(userId, userId, limit) as PairRoom[];
}

export function isParticipant(room: PairRoom, userId: string): boolean {
  return room.slotAUserId === userId || room.slotBUserId === userId;
}

export function messageCount(roomId: string): number {
  ensureMigrated();
  const db = getDb();
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM pair_messages WHERE roomId = ?`)
    .get(roomId) as { n: number } | undefined;
  return row?.n ?? 0;
}
