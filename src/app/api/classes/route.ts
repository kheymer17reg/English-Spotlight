import { NextResponse } from "next/server";
import {
  addGroupMember,
  createGroup,
  groupsByTeacher,
  groupsByUser,
  type GroupRecord,
} from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";

function randomJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/I/1 for readability
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "mine";
  if (scope === "teacher" && session.user.role === "teacher") {
    return NextResponse.json({ classes: groupsByTeacher(session.user.id) });
  }
  return NextResponse.json({ classes: groupsByUser(session.user.id) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "teacher") {
    return NextResponse.json({ error: "Только учителя могут создавать классы" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { name?: string; grade?: number };
  const name = (body.name ?? "").trim();
  const grade = Number(body.grade ?? 0);
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!grade || grade < 2 || grade > 8) {
    return NextResponse.json({ error: "grade must be 2..8" }, { status: 400 });
  }
  const group: GroupRecord = {
    id: `g_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
    name,
    grade,
    teacherId: session.user.id,
    joinCode: randomJoinCode(),
    createdAt: new Date().toISOString(),
  };
  createGroup(group);
  // Teacher is auto-added as member with role 'teacher' inside createGroup.
  addGroupMember(group.id, session.user.id, "teacher");
  return NextResponse.json({ ok: true, group });
}
