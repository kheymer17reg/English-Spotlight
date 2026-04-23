import { NextResponse } from "next/server";
import { recordActivity, type LogActivityInput } from "@/lib/activity-db";
import { addMistake } from "@/lib/mistakes-db";
import type { ActivityType, Grade, MistakeKind, MistakeSource } from "@/types";
import { logError } from "@/lib/db";

const ACTIVITY_TYPES: ActivityType[] = [
  "vocab_review",
  "exercise",
  "homework",
  "pronunciation",
  "roleplay",
  "reading",
  "listening",
  "game",
  "chat",
  "mistake_review",
];

const MISTAKE_KINDS: MistakeKind[] = ["vocab", "grammar", "listening", "translation", "reading"];
const MISTAKE_SOURCES: MistakeSource[] = ["exercise", "vocab_drill", "homework", "test", "dialogue"];

interface ActivityRequestBody {
  studentId: string;
  activityType: ActivityType;
  xp: number;
  correct?: number;
  total?: number;
  skill?: LogActivityInput["skill"];
  moduleNumber?: number;
  meta?: Record<string, unknown>;
  mistakes?: {
    kind: MistakeKind;
    source: MistakeSource;
    question: string;
    correctAnswer: string;
    studentAnswer?: string;
    wordId?: string;
    moduleNumber?: number;
    grade: Grade;
  }[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ActivityRequestBody;
    if (!body?.studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }
    if (!ACTIVITY_TYPES.includes(body.activityType)) {
      return NextResponse.json({ error: "invalid activityType" }, { status: 400 });
    }
    if (typeof body.xp !== "number" || body.xp < 0 || body.xp > 500) {
      return NextResponse.json({ error: "xp must be 0..500" }, { status: 400 });
    }

    // Record fresh mistakes first (so that badge engine counts them accurately).
    const addedMistakes: number[] = [];
    if (Array.isArray(body.mistakes)) {
      for (const m of body.mistakes) {
        if (!MISTAKE_KINDS.includes(m.kind) || !MISTAKE_SOURCES.includes(m.source)) continue;
        if (!m.question || !m.correctAnswer) continue;
        const rec = addMistake({
          studentId: body.studentId,
          kind: m.kind,
          source: m.source,
          question: m.question,
          correctAnswer: m.correctAnswer,
          studentAnswer: m.studentAnswer ?? null,
          wordId: m.wordId ?? null,
          moduleNumber: m.moduleNumber ?? null,
          grade: m.grade,
        });
        addedMistakes.push(rec.id);
      }
    }

    const result = recordActivity({
      studentId: body.studentId,
      activityType: body.activityType,
      xp: body.xp,
      correct: body.correct,
      total: body.total,
      skill: body.skill,
      moduleNumber: body.moduleNumber,
      meta: body.meta,
    });

    return NextResponse.json({
      ok: true,
      activity: result.activity,
      xp: result.xp,
      level: result.level,
      streak: result.streak,
      newBadges: result.newBadges,
      mistakesAdded: addedMistakes.length,
    });
  } catch (err) {
    await logError("/api/student/activity", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
