import { NextResponse } from "next/server";
import { addMistake, listActiveMistakes, listDueMistakes, mistakeStats } from "@/lib/mistakes-db";
import type { Grade, MistakeKind, MistakeSource } from "@/types";
import { logError } from "@/lib/db";

const MISTAKE_KINDS: MistakeKind[] = ["vocab", "grammar", "listening", "translation", "reading"];
const MISTAKE_SOURCES: MistakeSource[] = ["exercise", "vocab_drill", "homework", "test", "dialogue"];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");
    const dueOnly = url.searchParams.get("due") === "1";
    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }
    const list = dueOnly ? listDueMistakes(studentId) : listActiveMistakes(studentId);
    return NextResponse.json({ mistakes: list, stats: mistakeStats(studentId) });
  } catch (err) {
    await logError("/api/student/mistakes GET", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

interface AddMistakesBody {
  studentId: string;
  grade: Grade;
  items: {
    kind: MistakeKind;
    source: MistakeSource;
    question: string;
    correctAnswer: string;
    studentAnswer?: string;
    wordId?: string;
    moduleNumber?: number;
  }[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AddMistakesBody;
    if (!body.studentId || !Array.isArray(body.items) || !body.grade) {
      return NextResponse.json({ error: "studentId, grade, items required" }, { status: 400 });
    }
    let added = 0;
    for (const m of body.items) {
      if (!MISTAKE_KINDS.includes(m.kind) || !MISTAKE_SOURCES.includes(m.source)) continue;
      if (!m.question || !m.correctAnswer) continue;
      addMistake({
        studentId: body.studentId,
        kind: m.kind,
        source: m.source,
        question: m.question,
        correctAnswer: m.correctAnswer,
        studentAnswer: m.studentAnswer ?? null,
        wordId: m.wordId ?? null,
        moduleNumber: m.moduleNumber ?? null,
        grade: body.grade,
      });
      added += 1;
    }
    return NextResponse.json({ ok: true, added });
  } catch (err) {
    await logError("/api/student/mistakes POST", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
