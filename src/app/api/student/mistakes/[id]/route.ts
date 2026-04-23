import { NextResponse } from "next/server";
import { reviewMistake } from "@/lib/mistakes-db";
import { recordActivity } from "@/lib/activity-db";
import { logError } from "@/lib/db";

interface ReviewBody {
  studentId: string;
  wasCorrect: boolean;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }
    const body = (await req.json()) as ReviewBody;
    if (!body.studentId || typeof body.wasCorrect !== "boolean") {
      return NextResponse.json({ error: "studentId and wasCorrect required" }, { status: 400 });
    }
    const updated = reviewMistake(body.studentId, id, body.wasCorrect);
    if (!updated) {
      return NextResponse.json({ error: "mistake not found" }, { status: 404 });
    }
    // Correct review → +5 XP + mistake_review activity.
    // Incorrect review → +1 XP (participation), activity still logged.
    const activityResult = recordActivity({
      studentId: body.studentId,
      activityType: "mistake_review",
      xp: body.wasCorrect ? 5 : 1,
      correct: body.wasCorrect ? 1 : 0,
      total: 1,
      skill: updated.kind === "vocab" ? "vocabulary" : updated.kind === "grammar" ? "grammar" : "reading",
      moduleNumber: updated.moduleNumber ?? undefined,
      meta: { mistakeId: updated.id },
    });
    return NextResponse.json({
      ok: true,
      mistake: updated,
      xp: activityResult.xp,
      level: activityResult.level,
      streak: activityResult.streak,
      newBadges: activityResult.newBadges,
    });
  } catch (err) {
    await logError("/api/student/mistakes/[id] PATCH", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
