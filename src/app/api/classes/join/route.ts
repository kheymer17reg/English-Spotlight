import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addGroupMember, groupByJoinCode } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
  const group = groupByJoinCode(code);
  if (!group) return NextResponse.json({ error: "Класс с таким кодом не найден" }, { status: 404 });
  addGroupMember(group.id, session.user.id, "student");
  return NextResponse.json({ ok: true, group });
}
