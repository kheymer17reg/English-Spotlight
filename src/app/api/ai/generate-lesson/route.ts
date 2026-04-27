import { NextResponse } from "next/server";
import { extractJson, generateText } from "@/lib/llm";
import { lessonPlanPrompt } from "@/lib/prompts";
import { logError } from "@/lib/db";
import { moduleByGradeNumber } from "@/lib/curriculum";
import type { Grade, LessonPlan } from "@/types";
import { rateLimitForUser, requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
  const rl = await rateLimitForUser(req, "ai:generate-lesson", {
    capacity: 20,
    refillPerMinute: 0.33,
  });
  if (!rl.ok) return rl.response;
  const body = (await req.json()) as {
    grade: Grade;
    module: number;
    lessonType: string;
    focus: string;
    duration: number;
  };
  try {
    const { system, user } = lessonPlanPrompt({
      grade: body.grade,
      moduleNumber: body.module,
      lessonType: body.lessonType,
      focus: body.focus,
      duration: body.duration,
    });
    const { text } = await generateText({
      system,
      messages: [{ role: "user", content: user }],
      temperature: 0.45,
      maxTokens: 2000,
      json: true,
    });
    const parsed = extractJson<Pick<LessonPlan, "title" | "objectives" | "stages" | "materials" | "homework">>(text);
    if (!parsed?.title || !parsed?.stages?.length) throw new Error("Неверный ответ модели");
    const plan: LessonPlan = {
      ...parsed,
      grade: body.grade,
      module: body.module,
      lessonType: body.lessonType,
      focus: body.focus,
      duration: body.duration,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ plan });
  } catch (e: any) {
    if (e?.message === "NO_LLM_KEY") {
      return NextResponse.json({ plan: fallbackPlan(body) });
    }
    try { logError("generate-lesson", String(e?.message || e)); } catch {}
    return NextResponse.json({ error: e?.message || "AI error" }, { status: 500 });
  }
}

function fallbackPlan(body: {
  grade: Grade;
  module: number;
  lessonType: string;
  focus: string;
  duration: number;
}): LessonPlan {
  const mod = moduleByGradeNumber(body.grade, body.module);
  const d = body.duration;
  return {
    title: `Урок: ${mod?.title ?? "Spotlight"}`,
    grade: body.grade,
    module: body.module,
    lessonType: body.lessonType,
    focus: body.focus,
    duration: d,
    objectives: [
      `Отработать ${body.focus.toLowerCase()} в рамках темы "${mod?.title ?? ""}"`,
      "Развивать коммуникативные УУД (устная/письменная речь)",
      "Формировать положительное отношение к предмету",
    ],
    stages: [
      { stage: "Организационный момент", minutes: 3, activity: "Приветствие, целеполагание" },
      { stage: "Речевая разминка", minutes: 5, activity: "Вопросы-ответы по теме модуля" },
      { stage: "Введение нового материала", minutes: Math.max(8, Math.floor(d * 0.25)), activity: `Объяснение: ${body.focus}` },
      { stage: "Первичное закрепление", minutes: Math.max(8, Math.floor(d * 0.25)), activity: "Тренировочные упражнения в парах" },
      { stage: "Контроль / рефлексия", minutes: 5, activity: "Короткий квиз + обсуждение" },
      { stage: "Домашнее задание", minutes: 2, activity: "Объяснение ДЗ" },
    ],
    materials: ["Учебник Spotlight", "Аудио-трек модуля", "Раздаточные карточки", "Презентация"],
    homework: `Повторить лексику модуля "${mod?.title ?? ""}", выполнить упражнение из рабочей тетради`,
    createdAt: new Date().toISOString(),
  };
}
