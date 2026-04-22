import { NextResponse } from "next/server";
import { vocabularyByGrade } from "@/lib/vocabulary";
import type { Grade } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const grade = Number(url.searchParams.get("grade") || 5) as Grade;
  const n = Math.max(5, Math.min(20, Number(url.searchParams.get("n") || 10)));
  const pool = vocabularyByGrade(grade);
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
  const items = picked.map((w) => ({
    id: w.id,
    prompt: w.word,
    answer: w.translation,
    options: [
      w.translation,
      ...[...pool].filter((x) => x.id !== w.id).sort(() => Math.random() - 0.5).slice(0, 3).map((x) => x.translation),
    ].sort(() => Math.random() - 0.5),
  }));
  return NextResponse.json({ items });
}
