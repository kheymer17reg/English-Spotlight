import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { decodeQuestions, getSession, listPlayers } from "@/lib/quiz-db";
import { logError, getDb } from "@/lib/db";

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

    const db = getDb();
    const isPlayer = db
      .prepare(`SELECT 1 FROM quiz_players WHERE sessionId = ? AND userId = ? LIMIT 1`)
      .get(params.id, session.user.id);
    const isHost = s.hostId === session.user.id;
    if (!isPlayer && !isHost) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const questions = decodeQuestions(s.questions);
    const myAnswer = db
      .prepare(`SELECT answer, isCorrect, points FROM quiz_answers WHERE sessionId = ? AND userId = ? AND qIdx = ?`)
      .get(params.id, session.user.id, s.currentIdx) as
      | { answer: string; isCorrect: number; points: number }
      | undefined;

    const currentQuestion =
      s.status === "active" && s.currentIdx >= 0
        ? {
            qIdx: s.currentIdx,
            prompt: questions[s.currentIdx]?.prompt ?? "",
            options: questions[s.currentIdx]?.options ?? [],
            startedAt: s.questionStartedAt,
          }
        : null;

    const players = listPlayers(s.id).map((p) => ({
      userId: p.userId,
      name: p.name,
      score: p.score,
    }));
    const me = players.find((p) => p.userId === session.user.id) ?? null;
    return NextResponse.json({
      session: {
        id: s.id,
        title: s.title,
        status: s.status,
        currentIdx: s.currentIdx,
        total: questions.length,
      },
      currentQuestion,
      myAnswer: myAnswer
        ? { answer: myAnswer.answer, isCorrect: myAnswer.isCorrect === 1, points: myAnswer.points }
        : null,
      players,
      me,
    });
  } catch (err) {
    await logError("/api/quiz/[id] GET", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
