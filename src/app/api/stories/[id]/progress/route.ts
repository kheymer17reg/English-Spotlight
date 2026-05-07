import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStory } from "@/lib/stories";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/activity-db";

export const runtime = "nodejs";

interface PostBody {
  sceneIndex: number;
  correct: number;
  total: number;
  finished: boolean;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const story = getStory(params.id);
  if (!story) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as PostBody | null;
  if (!body) return NextResponse.json({ error: "bad body" }, { status: 400 });

  const sceneIndex = Math.max(0, Math.min(story.scenes.length, Math.floor(body.sceneIndex)));
  const correct = Math.max(0, Math.floor(body.correct));
  const total = Math.max(0, Math.floor(body.total));
  const finished = body.finished === true;
  const now = new Date().toISOString();

  const db = getDb();
  const existing = db
    .prepare(`SELECT finishedAt FROM story_progress WHERE studentId = ? AND storyId = ?`)
    .get(session.user.id, story.id) as { finishedAt: string | null } | undefined;
  db.prepare(
    `INSERT INTO story_progress (studentId, storyId, sceneIndex, correct, total, finishedAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(studentId, storyId) DO UPDATE SET
       sceneIndex = excluded.sceneIndex,
       correct = excluded.correct,
       total = excluded.total,
       finishedAt = CASE WHEN story_progress.finishedAt IS NULL THEN excluded.finishedAt ELSE story_progress.finishedAt END,
       updatedAt = excluded.updatedAt`,
  ).run(
    session.user.id,
    story.id,
    sceneIndex,
    correct,
    total,
    finished ? now : null,
    now,
  );

  // Award XP only on the first finish.
  let xpGained = 0;
  if (finished && !existing?.finishedAt) {
    const accuracy = total > 0 ? correct / total : 1;
    const base = 25;
    const bonus = Math.round(15 * accuracy);
    xpGained = base + bonus;
    logActivity({
      studentId: session.user.id,
      activityType: "story",
      xp: xpGained,
      correct,
      total,
      skill: "reading",
      meta: { storyId: story.id, title: story.title },
    });
  }

  return NextResponse.json({ ok: true, xpGained });
}
