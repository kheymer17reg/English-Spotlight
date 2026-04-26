import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findRoomByCode, isParticipant, setRoomStatus } from "@/lib/pair-roleplay-db";

export const runtime = "nodejs";

export async function POST(
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
  setRoomStatus(room.id, "done");
  return NextResponse.json({ ok: true });
}
