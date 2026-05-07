import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  findStudentByLinkCode,
  linkParentToStudent,
  unlinkParentFromStudent,
} from "@/lib/parent-db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "parent") {
    return NextResponse.json({ error: "Только родители могут привязывать ребёнка" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = (body.code ?? "").trim().toUpperCase();
  if (!code || code.length < 4) {
    return NextResponse.json({ error: "Введите корректный код" }, { status: 400 });
  }
  const student = findStudentByLinkCode(code);
  if (!student) {
    return NextResponse.json({ error: "Код не найден. Попроси ребёнка заново открыть профиль." }, { status: 404 });
  }
  const added = linkParentToStudent(session.user.id, student.id);
  return NextResponse.json({
    ok: true,
    added,
    student: { id: student.id, name: student.name, grade: student.grade },
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "parent") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { studentId?: string };
  const studentId = (body.studentId ?? "").trim();
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  unlinkParentFromStudent(session.user.id, studentId);
  return NextResponse.json({ ok: true });
}
