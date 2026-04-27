import { NextResponse } from "next/server";
import { generateText, extractJson } from "@/lib/llm";
import { exercisePrompt } from "@/lib/prompts";
import { logError } from "@/lib/db";
import { moduleByGradeNumber } from "@/lib/curriculum";
import type { Difficulty, ExerciseItem, ExerciseType, GeneratedExercise, Grade } from "@/types";
import { shuffle, uid } from "@/lib/utils";
import { rateLimitForUser, requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  // 30 generations / hour / user — enough for class prep, low enough to make
  // a leaked session useless for cost-burn.
  const rl = await rateLimitForUser(req, "ai:generate-exercise", {
    capacity: 30,
    refillPerMinute: 0.5,
  });
  if (!rl.ok) return rl.response;

  const body = (await req.json()) as {
    grade: Grade;
    module: number;
    type: ExerciseType;
    difficulty: Difficulty;
    count: number;
  };
  try {
    const { system, user } = exercisePrompt({
      grade: body.grade,
      moduleNumber: body.module,
      type: body.type,
      difficulty: body.difficulty,
      count: Math.max(3, Math.min(20, body.count || 6)),
    });
    const { text } = await generateText({
      system,
      messages: [{ role: "user", content: user }],
      temperature: 0.6,
      maxTokens: 1800,
      json: true,
    });
    const parsed = extractJson<{ title: string; items: ExerciseItem[] }>(text);
    if (!parsed?.items?.length) throw new Error("Неверный ответ модели");
    const exercise: GeneratedExercise = {
      title: parsed.title || `Упражнение: класс ${body.grade}, модуль ${body.module}`,
      grade: body.grade,
      module: body.module,
      type: body.type,
      difficulty: body.difficulty,
      items: parsed.items.map((it, i) => ({ ...it, id: it.id || String(i + 1) })),
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ exercise });
  } catch (e: any) {
    if (e?.message === "NO_LLM_KEY") {
      // Graceful fallback: generate a sensible demo exercise from curriculum data.
      return NextResponse.json({ exercise: fallbackExercise(body) });
    }
    try { logError("generate-exercise", String(e?.message || e)); } catch {}
    return NextResponse.json({ error: e?.message || "AI error" }, { status: 500 });
  }
}

function fallbackExercise(body: {
  grade: Grade;
  module: number;
  type: ExerciseType;
  difficulty: Difficulty;
  count: number;
}): GeneratedExercise {
  const mod = moduleByGradeNumber(body.grade, body.module);
  const words = mod?.vocabulary ?? ["cat", "dog", "apple", "book", "house"];
  const count = Math.max(3, Math.min(10, body.count || 6));
  const items: ExerciseItem[] = [];
  for (let i = 0; i < count; i++) {
    const w = words[i % words.length];
    if (body.type === "fill_blank") {
      items.push({
        id: uid("q"),
        type: "fill_blank",
        prompt: `This is a ______ (${w}).`,
        answer: w,
        hint: `Слово на тему модуля "${mod?.title ?? ""}".`,
      });
    } else if (body.type === "true_false") {
      const truth = i % 2 === 0;
      items.push({
        id: uid("q"),
        type: "true_false",
        prompt: truth ? `"${w}" is an English word.` : `"${w}" is a Russian word.`,
        options: ["True", "False"],
        answer: truth ? "True" : "False",
      });
    } else if (body.type === "match_pairs") {
      items.push({
        id: uid("q"),
        type: "match_pairs",
        prompt: "Match the words with translations.",
        options: words.slice(0, 4),
        answer: words.slice(0, 4),
      });
      break;
    } else {
      const others = shuffle(words.filter((x) => x !== w)).slice(0, 3);
      const options = shuffle([w, ...others]);
      items.push({
        id: uid("q"),
        type: "multiple_choice",
        prompt: `Choose the correct word related to "${mod?.title ?? "the topic"}".`,
        options,
        answer: w,
      });
    }
  }
  return {
    title: `Демо-упражнение (без AI ключа): ${mod?.title ?? ""}`,
    grade: body.grade,
    module: body.module,
    type: body.type,
    difficulty: body.difficulty,
    items,
    createdAt: new Date().toISOString(),
  };
}
