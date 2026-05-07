import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { answeredCount, getSession, recordAnswer } from "@/lib/quiz-db";
import { publishQuiz } from "@/lib/quiz-bus";
import { logError } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const s = getSession(params.id);
    if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (s.status !== "active") return NextResponse.json({ error: "not active" }, { status: 400 });
    const body = (await req.json().catch(() => ({}))) as { qIdx?: number; answer?: string };
    if (typeof body.answer !== "string" || typeof body.qIdx !== "number") {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    const r = recordAnswer({
      sessionId: s.id,
      userId: session.user.id,
      qIdx: body.qIdx,
      answer: body.answer,
    });
    if (!r) {
      return NextResponse.json({ error: "answer rejected (late, duplicate or wrong question)" }, { status: 400 });
    }
    const count = answeredCount(s.id, body.qIdx);
    publishQuiz(s.id, {
      type: "player.answered",
      sessionId: s.id,
      userId: session.user.id,
      qIdx: body.qIdx,
      answeredCount: count,
    });
    return NextResponse.json({ ok: true, isCorrect: r.isCorrect, points: r.points, timeMs: r.timeMs });
  } catch (err) {
    await logError("/api/quiz/[id]/answer", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
