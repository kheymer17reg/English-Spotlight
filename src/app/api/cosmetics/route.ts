import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { totalXp } from "@/lib/activity-db";
import {
  catalogWithUnlock,
  getLoadout,
  isUnlocked,
  levelOf,
  setLoadout,
} from "@/lib/cosmetics-db";
import { findCosmetic } from "@/lib/cosmetics";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const level = levelOf(session.user.id);
  return NextResponse.json({
    xp: totalXp(session.user.id),
    level,
    loadout: getLoadout(session.user.id),
    catalog: catalogWithUnlock(level),
  });
}

interface PatchBody {
  avatarId?: string;
  frameId?: string;
  titleId?: string;
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ error: "bad body" }, { status: 400 });

  const level = levelOf(session.user.id);
  const patch: PatchBody = {};
  for (const [key, value] of Object.entries(body) as [keyof PatchBody, string | undefined][]) {
    if (typeof value !== "string") continue;
    const item = findCosmetic(value);
    if (!item) return NextResponse.json({ error: `unknown ${key}: ${value}` }, { status: 400 });
    const expectedKind = key === "avatarId" ? "avatar" : key === "frameId" ? "frame" : "title";
    if (item.kind !== expectedKind) {
      return NextResponse.json({ error: `${key} expects ${expectedKind} item` }, { status: 400 });
    }
    if (!isUnlocked(item, level)) {
      return NextResponse.json(
        { error: `${item.label} открывается с ${item.requireLevel} уровня` },
        { status: 403 },
      );
    }
    patch[key] = value;
  }

  const next = setLoadout(session.user.id, patch);
  return NextResponse.json({ ok: true, loadout: next, level });
}
