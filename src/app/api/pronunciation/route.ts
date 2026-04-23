import { NextResponse } from "next/server";
import { insertPronAttempt, pronAttemptsByGrade, type PronAttempt } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const grade = Number(searchParams.get("grade") || "0");
  if (!grade) return NextResponse.json({ error: "grade is required" }, { status: 400 });
  const attempts = pronAttemptsByGrade(grade);
  return NextResponse.json({ attempts });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<PronAttempt>;
  if (!body.studentId || !body.grade || !body.category || !body.expected) {
    return NextResponse.json(
      { error: "studentId, grade, category, expected required" },
      { status: 400 },
    );
  }
  const attempt: PronAttempt = {
    studentId: body.studentId,
    grade: Number(body.grade),
    category: body.category,
    expected: String(body.expected),
    transcript: String(body.transcript ?? ""),
    score: Number(body.score ?? 0),
    stars: Number(body.stars ?? 0),
    missedWords: Array.isArray(body.missedWords) ? body.missedWords.map(String) : [],
    createdAt: new Date().toISOString(),
  };
  insertPronAttempt(attempt);
  return NextResponse.json({ ok: true, attempt });
}
