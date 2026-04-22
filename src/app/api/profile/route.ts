import { NextResponse } from "next/server";
import { listStudents, seedDemoIfEmpty, upsertStudent } from "@/lib/db";
import type { Grade, StudentRecord } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  seedDemoIfEmpty();
  const url = new URL(req.url);
  const gradeStr = url.searchParams.get("grade");
  const q = url.searchParams.get("q") ?? undefined;
  const grade = gradeStr ? (Number(gradeStr) as Grade) : undefined;
  const students = listStudents({ grade, q });
  return NextResponse.json({ students });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<StudentRecord>;
  if (!body?.id || !body?.name || !body?.grade) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const record: StudentRecord = {
    id: body.id,
    name: body.name,
    grade: body.grade as Grade,
    createdAt: body.createdAt || new Date().toISOString(),
    streak: body.streak ?? 0,
    xp: body.xp ?? 0,
    level: body.level ?? 1,
    currentModule: body.currentModule ?? 1,
  };
  upsertStudent(record);
  return NextResponse.json({ ok: true, student: record });
}
