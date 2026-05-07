import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { REACTION_EMOJIS, toggleReaction, type FeedReactionEmoji } from "@/lib/feed-db";

export const runtime = "nodejs";

const REACTION_SET = new Set<string>(REACTION_EMOJIS);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    postId?: number;
    emoji?: FeedReactionEmoji;
  };
  const postId = Number(body.postId);
  const emoji = body.emoji;
  if (!postId || !emoji || !REACTION_SET.has(emoji)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const db = getDb();
  const row = db
    .prepare(`SELECT classId FROM feed_posts WHERE id = ?`)
    .get(postId) as { classId: string } | undefined;
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  const member = db
    .prepare(`SELECT 1 FROM group_members WHERE groupId = ? AND userId = ? LIMIT 1`)
    .get(row.classId, session.user.id) as { 1?: number } | undefined;
  if (!member) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const result = toggleReaction(postId, session.user.id, emoji);
  return NextResponse.json({ ok: true, ...result });
}
