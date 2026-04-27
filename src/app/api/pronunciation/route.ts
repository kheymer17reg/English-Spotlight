import { NextResponse } from "next/server";
import {
  insertPronAttempt,
  pronAttemptsByGrade,
  type AzurePronStored,
  type PronAttempt,
} from "@/lib/db";
import { requireAuth, requireOwnStudentOrTeacher, requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
  const { searchParams } = new URL(req.url);
  const grade = Number(searchParams.get("grade") || "0");
  if (!grade) return NextResponse.json({ error: "grade is required" }, { status: 400 });
  const attempts = pronAttemptsByGrade(grade);
  return NextResponse.json({ attempts });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as Partial<PronAttempt> & {
    azure?: AzurePronStored | null;
    engine?: "web-speech" | "azure" | null;
  };
  if (!body.studentId || !body.grade || !body.category || !body.expected) {
    return NextResponse.json(
      { error: "studentId, grade, category, expected required" },
      { status: 400 },
    );
  }
  const own = await requireOwnStudentOrTeacher(body.studentId);
  if (!own.ok) return own.response;
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
    engine: body.engine ?? null,
    azure: body.azure ?? null,
  };
  insertPronAttempt(attempt);
  return NextResponse.json({ ok: true, attempt });
}
