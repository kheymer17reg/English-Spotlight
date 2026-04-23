import { NextResponse } from "next/server";
import {
  entriesForStudent,
  getStudent,
  completionsForStudent,
  listHomework,
  seedDemoIfEmpty,
} from "@/lib/db";
import {
  recentActivities,
  skillAccuracy,
  totalXp,
  xpSince,
} from "@/lib/activity-db";
import { mistakeStats } from "@/lib/mistakes-db";

export const runtime = "nodejs";

/**
 * Aggregated profile summary for a student, used by the teacher journal
 * drawer (dnevnik-style profile-on-click) and, later, the parent cabinet.
 *
 * GET /api/student/summary?id=<studentId>&period=week|month|quarter|all
 */
export async function GET(req: Request) {
  seedDemoIfEmpty();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const student = getStudent(id);
  if (!student) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const period = (url.searchParams.get("period") ?? "all") as
    | "week"
    | "month"
    | "quarter"
    | "all";
  const now = new Date();
  const sinceDate = new Date(now);
  if (period === "week") sinceDate.setUTCDate(sinceDate.getUTCDate() - 7);
  else if (period === "month") sinceDate.setUTCMonth(sinceDate.getUTCMonth() - 1);
  else if (period === "quarter") sinceDate.setUTCMonth(sinceDate.getUTCMonth() - 3);
  else sinceDate.setUTCFullYear(1970);
  const sinceIso = sinceDate.toISOString();
  const sinceDay = sinceIso.slice(0, 10);

  // Journal: marks & attendance, filtered by period (lesson.date >= sinceDay).
  const allEntries = entriesForStudent(id);
  const entries = allEntries.filter((e) => e.lesson.date >= sinceDay);
  const marksByValue: Record<"2" | "3" | "4" | "5", number> = {
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };
  const attendanceCounts: Record<"present" | "late" | "excused" | "absent", number> = {
    present: 0,
    late: 0,
    excused: 0,
    absent: 0,
  };
  const numericMarks: number[] = [];
  const timeline: {
    date: string;
    topic: string;
    mark: string | null;
    attendance: string;
    comment: string | null;
  }[] = [];
  for (const e of entries) {
    attendanceCounts[e.attendance] += 1;
    if (e.mark && (e.mark === "2" || e.mark === "3" || e.mark === "4" || e.mark === "5")) {
      marksByValue[e.mark] += 1;
      numericMarks.push(Number(e.mark));
    }
    timeline.push({
      date: e.lesson.date,
      topic: e.lesson.topic,
      mark: e.mark,
      attendance: e.attendance,
      comment: e.comment,
    });
  }
  timeline.sort((a, b) => b.date.localeCompare(a.date));
  const avg = numericMarks.length
    ? numericMarks.reduce((a, b) => a + b, 0) / numericMarks.length
    : null;

  // Homework assigned to student's grade, with completion status.
  const hw = listHomework(student.grade, id);
  const completions = new Set(completionsForStudent(id).map((c) => c.homeworkId));
  const hwDue = hw.filter((h) => !h.dueDate || h.dueDate >= sinceDay).slice(0, 50);
  const hwDone = hwDue.filter((h) => completions.has(h.id)).length;

  // Activity: skills + xp + recent events (for the timeline chart).
  const skills = skillAccuracy(id);
  const xpTotal = totalXp(id);
  const xpPeriod = xpSince(id, sinceIso);
  const recent = recentActivities(id, 20);

  // Mistakes summary.
  const mistakes = mistakeStats(id);

  return NextResponse.json({
    student,
    period,
    sinceIso,
    journal: {
      avg,
      marksByValue,
      attendanceCounts,
      totalMarks: numericMarks.length,
      timeline: timeline.slice(0, 30),
    },
    homework: {
      total: hwDue.length,
      done: hwDone,
      pending: hwDue.length - hwDone,
    },
    activity: {
      xpTotal,
      xpPeriod,
      skills,
      recent: recent.map((r) => ({
        id: r.id,
        type: r.activityType,
        xp: r.xp,
        correct: r.correct,
        total: r.total,
        skill: r.skill,
        createdAt: r.createdAt,
      })),
    },
    mistakes,
  });
}
