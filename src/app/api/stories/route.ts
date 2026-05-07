import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listStoriesByGrade, listAllStories } from "@/lib/stories";
import { getDb } from "@/lib/db";
import type { Grade } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const gradeParam = Number(url.searchParams.get("grade"));
  const stories =
    gradeParam >= 2 && gradeParam <= 8
      ? listStoriesByGrade(gradeParam as Grade)
      : listAllStories();
  const db = getDb();
  const rows = db
    .prepare(`SELECT storyId, sceneIndex, correct, total, finishedAt FROM story_progress WHERE studentId = ?`)
    .all(session.user.id) as { storyId: string; sceneIndex: number; correct: number; total: number; finishedAt: string | null }[];
  const progressMap = new Map(rows.map((r) => [r.storyId, r]));
  return NextResponse.json({
    stories: stories.map((s) => ({
      id: s.id,
      title: s.title,
      titleRu: s.titleRu,
      emoji: s.emoji,
      grade: s.grade,
      durationMin: s.durationMin,
      summary: s.summary,
      sceneCount: s.scenes.length,
      progress: progressMap.get(s.id) ?? null,
    })),
  });
}
