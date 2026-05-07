import { NextResponse } from "next/server";
import { markHomeworkDone, unmarkHomework, completionsForStudent } from "@/lib/db";
import { requireAuth, requireOwnStudentOrTeacher } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  const own = await requireOwnStudentOrTeacher(studentId);
  if (!own.ok) return own.response;
  return NextResponse.json({ completions: completionsForStudent(studentId) });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { homeworkId?: string; studentId?: string; done?: boolean };
  if (!body.homeworkId || !body.studentId) {
    return NextResponse.json({ error: "homeworkId and studentId are required" }, { status: 400 });
  }
  const own = await requireOwnStudentOrTeacher(body.studentId);
  if (!own.ok) return own.response;
  if (body.done === false) {
    unmarkHomework(body.homeworkId, body.studentId);
  } else {
    markHomeworkDone(body.homeworkId, body.studentId);
  }
  return NextResponse.json({ ok: true });
}
