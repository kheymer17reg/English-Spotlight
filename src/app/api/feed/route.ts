import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import {
  createPost,
  listClassFeed,
  type FeedPostKind,
} from "@/lib/feed-db";

export const runtime = "nodejs";

/** Verify the requester is a member of the class (student or teacher). */
function userBelongsToClass(userId: string, classId: string): boolean {
  const db = getDb();
  const row = db
    .prepare(`SELECT 1 FROM group_members WHERE groupId = ? AND userId = ? LIMIT 1`)
    .get(classId, userId) as { 1?: number } | undefined;
  return Boolean(row);
}

/** Resolve studentId for the signed-in user, if any. */
function resolveStudentId(userId: string): string | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT studentId FROM users WHERE id = ?`)
    .get(userId) as { studentId: string | null } | undefined;
  return row?.studentId ?? null;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const classId = url.searchParams.get("classId");
  if (!classId) {
    return NextResponse.json({ error: "classId required" }, { status: 400 });
  }
  if (!userBelongsToClass(session.user.id, classId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 30) || 30, 100);
  const posts = listClassFeed(classId, session.user.id, limit);
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    classId?: string;
    kind?: FeedPostKind;
    payload?: Record<string, unknown>;
  };
  const classId = body.classId;
  const kind = body.kind;
  if (!classId || !kind) {
    return NextResponse.json({ error: "classId and kind required" }, { status: 400 });
  }
  if (!userBelongsToClass(session.user.id, classId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // Posts are authored by the student record (matches activity stream IDs).
  // Teachers can also post (we'll show them as "teacher_note" usually).
  const studentId =
    session.user.role === "student" ? resolveStudentId(session.user.id) : session.user.id;
  if (!studentId) {
    return NextResponse.json({ error: "no student profile" }, { status: 400 });
  }
  const id = createPost({
    classId,
    authorId: studentId,
    kind,
    payload: body.payload ?? {},
  });
  return NextResponse.json({ ok: true, id });
}
