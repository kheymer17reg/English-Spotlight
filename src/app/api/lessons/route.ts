import { NextResponse } from "next/server";
import { listMethodicalLessons, methodicalStats, upsertMethodicalLesson } from "@/lib/methodical-db";
import { buildSkeletons } from "@/lib/methodical-skeleton";
import type { Grade } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const gradeParam = url.searchParams.get("grade");
  const moduleParam = url.searchParams.get("module");
  const grade = gradeParam ? (Number(gradeParam) as Grade) : undefined;
  const moduleNumber = moduleParam ? Number(moduleParam) : undefined;
  const lessons = listMethodicalLessons({ grade, moduleNumber });
  const stats = methodicalStats();
  return NextResponse.json({ lessons, stats });
}

// POST — ensure all 196 stub rows exist in DB (idempotent).
export async function POST() {
  const skeletons = buildSkeletons();
  let inserted = 0;
  for (const s of skeletons) {
    upsertMethodicalLesson(s);
    inserted += 1;
  }
  return NextResponse.json({ ok: true, total: inserted });
}
