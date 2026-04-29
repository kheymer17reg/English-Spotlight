import { NextResponse } from "next/server";
import { findUserById, getStudent, upsertStudent, upsertUser } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import type { Grade, StudentRecord } from "@/types";

export const runtime = "nodejs";

// Returns the StudentRecord linked to the current user. If the user is a
// student but has no record yet (legacy account from before signup auto-
// provisioning), one is created on the fly so /student/* pages always have
// data to render. Teacher / parent accounts return 404 — they don't have a
// StudentRecord of their own.
export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  if (guard.role !== "student") {
    return NextResponse.json({ error: "not a student" }, { status: 404 });
  }
  const user = findUserById(guard.userId);
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  let student: StudentRecord | undefined;
  if (user.studentId) student = getStudent(user.studentId);

  if (!student) {
    // Self-heal: create a record now and link it back to the user.
    const stuId = `stu_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    const grade = (user.grade && user.grade >= 2 && user.grade <= 11 ? user.grade : 5) as Grade;
    const fallbackName = user.name || (user.email ? user.email.split("@")[0] : "Ученик");
    const record: StudentRecord = {
      id: stuId,
      name: fallbackName,
      grade,
      createdAt: new Date().toISOString(),
      streak: 0,
      xp: 0,
      level: 1,
      currentModule: 1,
    };
    upsertStudent(record);
    upsertUser({ ...user, studentId: stuId });
    student = record;
  }

  return NextResponse.json({ student });
}
