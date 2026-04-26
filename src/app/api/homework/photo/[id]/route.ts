import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPhoto, gradePhoto, stripImageData } from "@/lib/photo-hw-db";
import { getDb, logError } from "@/lib/db";
import { sendToUser } from "@/lib/push";

export const runtime = "nodejs";

function isTeacherOf(userId: string, classId: string | null): boolean {
  if (!classId) return false;
  const db = getDb();
  const row = db
    .prepare(`SELECT teacherId FROM groups WHERE id = ?`)
    .get(classId) as { teacherId: string } | undefined;
  return row?.teacherId === userId;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const row = getPhoto(params.id);
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  const owner = row.studentId === session.user.id;
  const teacher = isTeacherOf(session.user.id, row.classId);
  if (!owner && !teacher) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ submission: row });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const row = getPhoto(params.id);
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (!isTeacherOf(session.user.id, row.classId)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const body = (await req.json().catch(() => null)) as { grade?: number; comment?: string } | null;
    const grade = Number(body?.grade);
    if (!Number.isFinite(grade) || grade < 2 || grade > 5) {
      return NextResponse.json({ error: "grade must be 2..5" }, { status: 400 });
    }
    const comment = typeof body?.comment === "string" ? body.comment.slice(0, 500) : null;
    gradePhoto(params.id, grade, comment);

    void sendToUser(row.studentId, {
      title: `Учитель проверил фото-ДЗ — ${grade}`,
      body: comment ?? row.title ?? "Открой, чтобы посмотреть разбор",
      url: "/student/homework/photo",
      tag: `photo-hw-${row.id}`,
    });

    const updated = getPhoto(params.id);
    return NextResponse.json({ ok: true, submission: updated ? stripImageData(updated) : null });
  } catch (err) {
    await logError("/api/homework/photo PATCH", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
