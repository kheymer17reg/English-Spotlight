import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  advanceQuestion,
  answeredCount,
  decodeQuestions,
  getSession,
  listPlayers,
  questionStats,
  setStatus,
} from "@/lib/quiz-db";
import { publishQuiz } from "@/lib/quiz-bus";
import { logError } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const s = getSession(params.id);
    if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (s.hostId !== session.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const questions = decodeQuestions(s.questions);
    return NextResponse.json({
      session: {
        id: s.id,
        pin: s.pin,
        title: s.title,
        grade: s.grade,
        status: s.status,
        currentIdx: s.currentIdx,
        questionStartedAt: s.questionStartedAt,
        total: questions.length,
      },
      currentQuestion:
        s.status === "active" && s.currentIdx >= 0 ? questions[s.currentIdx] : null,
      players: listPlayers(s.id),
      answered: s.currentIdx >= 0 ? answeredCount(s.id, s.currentIdx) : 0,
      stats: s.currentIdx >= 0 ? questionStats(s.id, s.currentIdx) : [],
    });
  } catch (err) {
    await logError("/api/quiz/host/[id] GET", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const s = getSession(params.id);
    if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (s.hostId !== session.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const body = (await req.json().catch(() => ({}))) as { action?: "start" | "next" | "end" };
    const action = body.action;
    if (action === "start" || action === "next") {
      const r = advanceQuestion(s.id);
      if (r.finished) {
        publishQuiz(s.id, { type: "session.finished", sessionId: s.id });
      } else {
        publishQuiz(s.id, { type: "question.advanced", sessionId: s.id, qIdx: r.idx });
      }
      return NextResponse.json({ ok: true, idx: r.idx, finished: r.finished });
    }
    if (action === "end") {
      setStatus(s.id, "finished");
      publishQuiz(s.id, { type: "session.finished", sessionId: s.id });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    await logError("/api/quiz/host/[id] POST", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
