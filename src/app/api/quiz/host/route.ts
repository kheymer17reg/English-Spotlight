import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSession, generateVocabQuestions, listHostSessions } from "@/lib/quiz-db";
import type { Grade } from "@/types";
import { logError } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "teacher") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const sessions = listHostSessions(session.user.id, 10).map((s) => ({
      id: s.id,
      pin: s.pin,
      title: s.title,
      grade: s.grade,
      status: s.status,
      createdAt: s.createdAt,
      finishedAt: s.finishedAt,
    }));
    return NextResponse.json({ sessions });
  } catch (err) {
    await logError("/api/quiz/host GET", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "teacher") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const body = (await req.json().catch(() => ({}))) as {
      grade?: number;
      classId?: string | null;
      title?: string;
      n?: number;
    };
    const grade = (Math.max(2, Math.min(8, Number(body.grade ?? 5))) as Grade);
    const n = Math.max(5, Math.min(20, Number(body.n ?? 10)));
    const title = (body.title ?? "Словарный квиз").slice(0, 80);
    const questions = generateVocabQuestions(grade, n);
    if (questions.length < 5) {
      return NextResponse.json({ error: "not enough vocabulary" }, { status: 400 });
    }
    const created = createSession({
      hostId: session.user.id,
      classId: body.classId ?? null,
      grade,
      title,
      questions,
    });
    return NextResponse.json({
      ok: true,
      session: { id: created.id, pin: created.pin, title: created.title, grade: created.grade },
    });
  } catch (err) {
    await logError("/api/quiz/host POST", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
