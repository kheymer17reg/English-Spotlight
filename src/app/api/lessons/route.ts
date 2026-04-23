import { NextResponse } from "next/server";
import {
  getMethodicalLesson,
  listMethodicalLessons,
  methodicalStats,
  upsertMethodicalLesson,
} from "@/lib/methodical-db";
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

// POST — ensure all 196 stub rows exist in DB. Does NOT overwrite lessons
// that are already "generated" or "edited" (so batch-seed restarts are safe).
export async function POST() {
  const skeletons = buildSkeletons();
  let inserted = 0;
  let skipped = 0;
  for (const s of skeletons) {
    const existing = getMethodicalLesson(s.id);
    if (existing && existing.status !== "stub") {
      skipped += 1;
      continue;
    }
    upsertMethodicalLesson(s);
    inserted += 1;
  }
  return NextResponse.json({ ok: true, total: skeletons.length, inserted, skipped });
}
