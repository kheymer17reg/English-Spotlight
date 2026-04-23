import { NextResponse } from "next/server";
import { extractJson, generateText } from "@/lib/llm";
import { methodicalLessonPrompt } from "@/lib/methodical-prompt";
import { getMethodicalLesson, upsertMethodicalLesson } from "@/lib/methodical-db";
import { logError } from "@/lib/db";
import type { MethodicalLesson } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as { id: string };
  const stub = getMethodicalLesson(body.id);
  if (!stub) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { system, user } = methodicalLessonPrompt(stub);
  try {
    const { text } = await generateText({
      system,
      messages: [{ role: "user", content: user }],
      temperature: 0.4,
      maxTokens: 3200,
      json: true,
    });
    const parsed = extractJson<
      Pick<MethodicalLesson, "objectives" | "equipment" | "stages" | "reflection" | "homework" | "handouts">
    >(text);
    if (!parsed?.objectives || !parsed?.stages?.length) {
      throw new Error("Неверный ответ модели");
    }
    const updated: MethodicalLesson = {
      ...stub,
      objectives: parsed.objectives,
      equipment: parsed.equipment ?? stub.equipment,
      stages: parsed.stages,
      reflection: parsed.reflection ?? "",
      homework: parsed.homework ?? "",
      handouts: parsed.handouts ?? [],
      status: "generated",
      updatedAt: new Date().toISOString(),
    };
    upsertMethodicalLesson(updated);
    return NextResponse.json({ lesson: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "NO_LLM_KEY") {
      return NextResponse.json({ error: "NO_LLM_KEY" }, { status: 400 });
    }
    try {
      logError("generate-methodical", msg);
    } catch {}
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
