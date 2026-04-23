import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGroup, groupMembers, removeGroupMember } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const group = getGroup(params.id);
  if (!group) return NextResponse.json({ error: "not found" }, { status: 404 });
  const members = groupMembers(group.id);
  // Only teacher owner or a member may view.
  const isMember = members.some((m) => m.userId === session.user.id);
  if (!isMember && group.teacherId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ group, members });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const group = getGroup(params.id);
  if (!group) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (group.teacherId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (userId === session.user.id) {
    return NextResponse.json({ error: "нельзя удалить самого себя" }, { status: 400 });
  }
  removeGroupMember(group.id, userId);
  return NextResponse.json({ ok: true });
}
