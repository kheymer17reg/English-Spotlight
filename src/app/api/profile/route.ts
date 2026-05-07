import { NextResponse } from "next/server";
import { listStudents, seedDemoIfEmpty, upsertStudent } from "@/lib/db";
import type { Grade, StudentRecord } from "@/types";
import { requireAuth, requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";

// Reading the roster is for teachers; students see their own data via /api/student/*.
export async function GET(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
  seedDemoIfEmpty();
  const url = new URL(req.url);
  const gradeStr = url.searchParams.get("grade");
  const q = url.searchParams.get("q") ?? undefined;
  const grade = gradeStr ? (Number(gradeStr) as Grade) : undefined;
  const students = listStudents({ grade, q });
  return NextResponse.json({ students });
}

// Upserting a student record (creating a roster slot, fixing name/grade) is teacher-only.
// XP / level / streak are handled via /api/student/activity, not exposed here.
export async function POST(req: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const body = (await req.json()) as Partial<StudentRecord>;
  if (!body?.id || !body?.name || !body?.grade) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  // Students can only edit their own record (and cannot change xp/level).
  if (guard.role === "student") {
    const ownStudentId =
      // Avoid an extra import: piggyback on existing user lookup.
      (await import("@/lib/db")).findUserById(guard.userId)?.studentId ?? null;
    if (ownStudentId !== body.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } else if (guard.role !== "teacher") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const record: StudentRecord = {
    id: body.id,
    name: body.name,
    grade: body.grade as Grade,
    createdAt: body.createdAt || new Date().toISOString(),
    streak: guard.role === "teacher" ? body.streak ?? 0 : 0,
    xp: guard.role === "teacher" ? body.xp ?? 0 : 0,
    level: guard.role === "teacher" ? body.level ?? 1 : 1,
    currentModule: body.currentModule ?? 1,
  };
  upsertStudent(record);
  return NextResponse.json({ ok: true, student: record });
}
