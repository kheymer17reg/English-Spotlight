import { NextResponse } from "next/server";
import { markHomeworkDone, unmarkHomework, completionsForStudent } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  return NextResponse.json({ completions: completionsForStudent(studentId) });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { homeworkId?: string; studentId?: string; done?: boolean };
  if (!body.homeworkId || !body.studentId) {
    return NextResponse.json({ error: "homeworkId and studentId are required" }, { status: 400 });
  }
  if (body.done === false) {
    unmarkHomework(body.homeworkId, body.studentId);
  } else {
    markHomeworkDone(body.homeworkId, body.studentId);
  }
  return NextResponse.json({ ok: true });
}
