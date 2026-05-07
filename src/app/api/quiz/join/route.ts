import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addPlayer, getSessionByPin } from "@/lib/quiz-db";
import { publishQuiz } from "@/lib/quiz-bus";
import { logError } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Войди в кабинет, чтобы присоединиться" }, { status: 401 });
    }
    const body = (await req.json().catch(() => ({}))) as { pin?: string };
    const pin = String(body.pin ?? "").trim();
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN должен быть 6 цифр" }, { status: 400 });
    }
    const s = getSessionByPin(pin);
    if (!s) return NextResponse.json({ error: "Квиз не найден" }, { status: 404 });
    if (s.status === "finished") return NextResponse.json({ error: "Квиз уже завершён" }, { status: 400 });
    const name = session.user.name?.trim() || "Игрок";
    addPlayer(s.id, session.user.id, name);
    publishQuiz(s.id, { type: "player.joined", sessionId: s.id, userId: session.user.id, name });
    return NextResponse.json({ ok: true, sessionId: s.id });
  } catch (err) {
    await logError("/api/quiz/join", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
