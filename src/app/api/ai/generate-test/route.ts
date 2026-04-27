import { NextResponse } from "next/server";
import { extractJson, generateText } from "@/lib/llm";
import { testPrompt } from "@/lib/prompts";
import { logError, saveAttempt } from "@/lib/db";
import { moduleByGradeNumber } from "@/lib/curriculum";
import { uid } from "@/lib/utils";
import type { ExerciseItem, GeneratedTest, Grade } from "@/types";
import { rateLimitForUser, requireAuth, requireOwnStudentOrTeacher, requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
  const rl = await rateLimitForUser(req, "ai:generate-test", {
    capacity: 15,
    refillPerMinute: 0.25,
  });
  if (!rl.ok) return rl.response;
  const body = (await req.json()) as {
    grade: Grade;
    format: GeneratedTest["format"];
    module?: number;
  };
  try {
    const { system, user } = testPrompt({
      grade: body.grade,
      format: body.format,
      moduleNumber: body.module,
    });
    const { text } = await generateText({
      system,
      messages: [{ role: "user", content: user }],
      temperature: 0.5,
      maxTokens: 2400,
      json: true,
    });
    const parsed = extractJson<Omit<GeneratedTest, "grade" | "module" | "format" | "createdAt">>(text);
    if (!parsed?.sections?.length) throw new Error("Неверный ответ модели");
    const test: GeneratedTest = {
      ...parsed,
      grade: body.grade,
      module: body.module,
      format: body.format,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ test });
  } catch (e: any) {
    if (e?.message === "NO_LLM_KEY") {
      return NextResponse.json({ test: fallbackTest(body) });
    }
    try { logError("generate-test", String(e?.message || e)); } catch {}
    return NextResponse.json({ error: e?.message || "AI error" }, { status: 500 });
  }
}

function fallbackTest(body: {
  grade: Grade;
  format: GeneratedTest["format"];
  module?: number;
}): GeneratedTest {
  const mod = body.module ? moduleByGradeNumber(body.grade, body.module) : undefined;
  const vocab = mod?.vocabulary ?? ["house", "family", "food"];
  const mk = (prompt: string, ans: string, options?: string[]): ExerciseItem => ({
    id: uid("q"),
    type: options ? "multiple_choice" : "fill_blank",
    prompt,
    answer: ans,
    options,
  });
  return {
    title: `Демо-тест: ${mod?.title ?? body.format}`,
    grade: body.grade,
    module: body.module,
    format: body.format,
    totalScore: 20,
    createdAt: new Date().toISOString(),
    sections: [
      {
        heading: "Vocabulary",
        items: [
          mk(`Translate: "${vocab[0]}"`, "перевод"),
          mk(`Pick a word from the module "${mod?.title ?? ""}"`, vocab[0], [vocab[0], "apple", "river", "sky"]),
        ],
      },
      {
        heading: "Grammar",
        items: [
          mk("He ______ to school every day.", "goes", ["go", "goes", "going", "gone"]),
          mk("She has ______ pet.", "a", ["a", "an", "the", "—"]),
        ],
      },
    ],
  };
}

// Called from client after a test attempt to persist statistics
export async function PUT(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const body = (await req.json()) as {
      studentId: string;
      total: number;
      correct: number;
      module: number;
    };
    const own = await requireOwnStudentOrTeacher(body.studentId);
    if (!own.ok) return own.response;
    const score = Math.round((body.correct / Math.max(1, body.total)) * 100);
    saveAttempt({
      id: uid("att"),
      studentId: body.studentId,
      kind: "test",
      total: body.total,
      correct: body.correct,
      score,
      skill: "grammar",
      module: body.module,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
