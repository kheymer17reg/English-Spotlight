import { NextResponse } from "next/server";
import { recordActivity, type LogActivityInput } from "@/lib/activity-db";
import { addMistake } from "@/lib/mistakes-db";
import type { ActivityType, Grade, MistakeKind, MistakeSource } from "@/types";
import { getDb, logError } from "@/lib/db";
import { autoPostToAuthorClasses, recentSimilarPostExists } from "@/lib/feed-db";
import { requireOwnStudentOrTeacher } from "@/lib/api-auth";

const STREAK_MILESTONES = new Set([3, 5, 7, 14, 21, 30, 50, 100]);

const ACTIVITY_TYPES: ActivityType[] = [
  "vocab_review",
  "exercise",
  "homework",
  "pronunciation",
  "roleplay",
  "reading",
  "listening",
  "game",
  "chat",
  "mistake_review",
];

const MISTAKE_KINDS: MistakeKind[] = ["vocab", "grammar", "listening", "translation", "reading"];
const MISTAKE_SOURCES: MistakeSource[] = ["exercise", "vocab_drill", "homework", "test", "dialogue"];

interface ActivityRequestBody {
  studentId: string;
  activityType: ActivityType;
  xp: number;
  correct?: number;
  total?: number;
  skill?: LogActivityInput["skill"];
  moduleNumber?: number;
  meta?: Record<string, unknown>;
  mistakes?: {
    kind: MistakeKind;
    source: MistakeSource;
    question: string;
    correctAnswer: string;
    studentAnswer?: string;
    wordId?: string;
    moduleNumber?: number;
    grade: Grade;
  }[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ActivityRequestBody;
    if (!body?.studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }
    // Block the trivial "spoof someone else's studentId" attack: students may
    // only post activity for their own linked studentId; teachers can post on
    // behalf of any student in their class (e.g. when grading homework).
    const guard = await requireOwnStudentOrTeacher(body.studentId);
    if (!guard.ok) return guard.response;
    if (!ACTIVITY_TYPES.includes(body.activityType)) {
      return NextResponse.json({ error: "invalid activityType" }, { status: 400 });
    }
    if (typeof body.xp !== "number" || body.xp < 0 || body.xp > 500) {
      return NextResponse.json({ error: "xp must be 0..500" }, { status: 400 });
    }

    // Record fresh mistakes first (so that badge engine counts them accurately).
    const addedMistakes: number[] = [];
    if (Array.isArray(body.mistakes)) {
      for (const m of body.mistakes) {
        if (!MISTAKE_KINDS.includes(m.kind) || !MISTAKE_SOURCES.includes(m.source)) continue;
        if (!m.question || !m.correctAnswer) continue;
        const rec = addMistake({
          studentId: body.studentId,
          kind: m.kind,
          source: m.source,
          question: m.question,
          correctAnswer: m.correctAnswer,
          studentAnswer: m.studentAnswer ?? null,
          wordId: m.wordId ?? null,
          moduleNumber: m.moduleNumber ?? null,
          grade: m.grade,
        });
        addedMistakes.push(rec.id);
      }
    }

    // Snapshot prior level to detect level-up after the activity.
    const beforeRow = getDb()
      .prepare(`SELECT level FROM students WHERE id = ?`)
      .get(body.studentId) as { level: number } | undefined;
    const priorLevel = beforeRow?.level ?? 1;

    const result = recordActivity({
      studentId: body.studentId,
      activityType: body.activityType,
      xp: body.xp,
      correct: body.correct,
      total: body.total,
      skill: body.skill,
      moduleNumber: body.moduleNumber,
      meta: body.meta,
    });

    // Fire-and-forget feed posts on milestones. SQLite ops are sync and very fast,
    // so it's fine to do them inline; we just swallow errors so a feed mishap
    // never breaks the activity write itself.
    try {
      // Badges → one post per newly-unlocked badge.
      for (const badgeId of result.newBadges) {
        autoPostToAuthorClasses(body.studentId, "badge_unlocked", {
          badgeId,
        });
      }
      // Level up.
      if (result.level > priorLevel) {
        autoPostToAuthorClasses(body.studentId, "level_up", {
          fromLevel: priorLevel,
          toLevel: result.level,
        });
      }
      // Streak milestones (one per day at most).
      if (
        STREAK_MILESTONES.has(result.streak) &&
        !recentSimilarPostExists(body.studentId, "streak_milestone", 18 * 60 * 60)
      ) {
        autoPostToAuthorClasses(body.studentId, "streak_milestone", {
          streak: result.streak,
        });
      }
      // Perfect score on a sizeable exercise (avoid spamming flashcard taps).
      if (
        body.correct !== undefined &&
        body.total !== undefined &&
        body.total >= 5 &&
        body.correct === body.total &&
        (body.activityType === "exercise" ||
          body.activityType === "homework" ||
          body.activityType === "game") &&
        !recentSimilarPostExists(body.studentId, "perfect_score", 30 * 60)
      ) {
        autoPostToAuthorClasses(body.studentId, "perfect_score", {
          activityType: body.activityType,
          total: body.total,
          skill: body.skill ?? null,
          moduleNumber: body.moduleNumber ?? null,
        });
      }
    } catch (feedErr) {
      await logError("/api/student/activity:feed", String(feedErr));
    }

    return NextResponse.json({
      ok: true,
      activity: result.activity,
      xp: result.xp,
      level: result.level,
      streak: result.streak,
      newBadges: result.newBadges,
      mistakesAdded: addedMistakes.length,
    });
  } catch (err) {
    await logError("/api/student/activity", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
