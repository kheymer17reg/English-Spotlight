import { NextResponse } from "next/server";
import { getMethodicalLesson, upsertMethodicalLesson } from "@/lib/methodical-db";
import type { MethodicalLesson } from "@/types";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const lesson = getMethodicalLesson(ctx.params.id);
  if (!lesson) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ lesson });
}

// PATCH — edit lesson (teacher-side customisation). Accepts partial body.
export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const lesson = getMethodicalLesson(ctx.params.id);
  if (!lesson) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const patch = (await req.json()) as Partial<MethodicalLesson>;
  const next: MethodicalLesson = {
    ...lesson,
    ...patch,
    id: lesson.id,
    grade: lesson.grade,
    moduleNumber: lesson.moduleNumber,
    lessonNumber: lesson.lessonNumber,
    status: "edited",
    updatedAt: new Date().toISOString(),
  };
  upsertMethodicalLesson(next);
  return NextResponse.json({ lesson: next });
}
