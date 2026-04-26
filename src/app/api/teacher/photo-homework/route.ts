import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listForClass, listForTeacher, stripImageData } from "@/lib/photo-hw-db";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const classId = url.searchParams.get("classId");
  if (classId) {
    const db = getDb();
    const owner = db
      .prepare(`SELECT teacherId FROM groups WHERE id = ?`)
      .get(classId) as { teacherId: string } | undefined;
    if (owner?.teacherId !== session.user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ submissions: listForClass(classId).map(stripImageData) });
  }
  return NextResponse.json({ submissions: listForTeacher(session.user.id).map(stripImageData) });
}
