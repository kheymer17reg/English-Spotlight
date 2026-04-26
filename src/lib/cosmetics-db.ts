import "server-only";
import { getDb } from "@/lib/db";
import { totalXp } from "@/lib/activity-db";
import { COSMETICS, DEFAULTS, findCosmetic, type CosmeticItem } from "@/lib/cosmetics";

const XP_PER_LEVEL = 200;

export interface CosmeticLoadout {
  avatarId: string;
  frameId: string;
  titleId: string;
}

export function levelOf(userId: string): number {
  const xp = totalXp(userId);
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getLoadout(userId: string): CosmeticLoadout {
  const db = getDb();
  const row = db
    .prepare(`SELECT avatarId, frameId, titleId FROM user_cosmetics WHERE userId = ?`)
    .get(userId) as { avatarId: string | null; frameId: string | null; titleId: string | null } | undefined;
  return {
    avatarId: row?.avatarId ?? DEFAULTS.avatarEmoji,
    frameId: row?.frameId ?? DEFAULTS.frameId,
    titleId: row?.titleId ?? DEFAULTS.titleId,
  };
}

export function setLoadout(userId: string, patch: Partial<CosmeticLoadout>): CosmeticLoadout {
  const db = getDb();
  const current = getLoadout(userId);
  const next: CosmeticLoadout = {
    avatarId: patch.avatarId ?? current.avatarId,
    frameId: patch.frameId ?? current.frameId,
    titleId: patch.titleId ?? current.titleId,
  };
  db.prepare(
    `INSERT INTO user_cosmetics (userId, avatarId, frameId, titleId, updatedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(userId) DO UPDATE SET
       avatarId = excluded.avatarId,
       frameId = excluded.frameId,
       titleId = excluded.titleId,
       updatedAt = excluded.updatedAt`,
  ).run(userId, next.avatarId, next.frameId, next.titleId, new Date().toISOString());
  return next;
}

export function isUnlocked(item: CosmeticItem, level: number): boolean {
  return level >= item.requireLevel;
}

export function catalogWithUnlock(level: number): (CosmeticItem & { unlocked: boolean })[] {
  return COSMETICS.map((c) => ({ ...c, unlocked: isUnlocked(c, level) }));
}

/** Look up a cosmetic by id, returning the resolved preview or empty string. */
export function previewOf(id: string): string {
  return findCosmetic(id)?.preview ?? "";
}
