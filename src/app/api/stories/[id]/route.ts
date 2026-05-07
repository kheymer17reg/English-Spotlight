import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStory } from "@/lib/stories";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const story = getStory(params.id);
  if (!story) return NextResponse.json({ error: "not found" }, { status: 404 });
  const db = getDb();
  const progress = db
    .prepare(`SELECT sceneIndex, correct, total, finishedAt FROM story_progress WHERE studentId = ? AND storyId = ?`)
    .get(session.user.id, story.id) as { sceneIndex: number; correct: number; total: number; finishedAt: string | null } | undefined;
  return NextResponse.json({ story, progress: progress ?? null });
}
