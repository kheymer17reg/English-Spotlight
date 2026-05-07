import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  findRoomByCode,
  isParticipant,
  listMessages,
  userSlotInRoom,
} from "@/lib/pair-roleplay-db";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

interface UserBrief {
  id: string;
  name: string | null;
}

function fetchUserNames(ids: string[]): Map<string, string> {
  const out = new Map<string, string>();
  if (ids.length === 0) return out;
  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT id, name FROM users WHERE id IN (${placeholders})`)
    .all(...ids) as UserBrief[];
  for (const r of rows) out.set(r.id, r.name ?? "Ученик");
  return out;
}

export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const room = findRoomByCode(params.code);
  if (!room) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isParticipant(room, session.user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const messages = listMessages(room.id);
  const slot = userSlotInRoom(room, session.user.id);
  const ids = [room.slotAUserId, room.slotBUserId].filter(
    (id): id is string => Boolean(id),
  );
  const names = fetchUserNames(ids);
  return NextResponse.json({
    room,
    mySlot: slot,
    partnerNames: {
      A: names.get(room.slotAUserId) ?? "Партнёр",
      B: room.slotBUserId ? names.get(room.slotBUserId) ?? "Партнёр" : null,
    },
    messages,
  });
}
