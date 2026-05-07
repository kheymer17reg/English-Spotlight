import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { joinRoomAsB } from "@/lib/pair-roleplay-db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = (body.code ?? "").trim().toUpperCase();
  if (!code || code.length < 4) {
    return NextResponse.json({ error: "Введите код комнаты" }, { status: 400 });
  }
  const room = joinRoomAsB(code, session.user.id);
  if (!room) {
    return NextResponse.json(
      { error: "Комната не найдена или истёк срок действия" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, room });
}
