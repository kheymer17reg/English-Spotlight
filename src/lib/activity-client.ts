"use client";

import type { ActivityType, Grade, MistakeKind, MistakeSource } from "@/types";

interface MistakePayload {
  kind: MistakeKind;
  source: MistakeSource;
  question: string;
  correctAnswer: string;
  studentAnswer?: string;
  wordId?: string;
  moduleNumber?: number;
  grade: Grade;
}

export interface LogActivityArgs {
  studentId: string;
  activityType: ActivityType;
  xp: number;
  correct?: number;
  total?: number;
  skill?: "grammar" | "vocabulary" | "reading" | "listening" | "speaking";
  moduleNumber?: number;
  meta?: Record<string, unknown>;
  mistakes?: MistakePayload[];
}

export interface LogActivityResult {
  ok: true;
  xp: number;
  level: number;
  streak: number;
  newBadges: string[];
  mistakesAdded: number;
}

export async function logActivity(args: LogActivityArgs): Promise<LogActivityResult | null> {
  try {
    const res = await fetch("/api/student/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    return (await res.json()) as LogActivityResult;
  } catch {
    return null;
  }
}

// XP formula:
//  - Base participation: 5 XP per exercise attempted.
//  - Correctness bonus: (correct / total) * 25 XP.
//  - Perfect bonus: +10 XP if 100% correct (and total >= 3).
export function computeExerciseXp(correct: number, total: number): number {
  if (total <= 0) return 0;
  const base = 5;
  const acc = Math.round((correct / total) * 25);
  const perfect = total >= 3 && correct === total ? 10 : 0;
  return base + acc + perfect;
}

// Vocab review XP per answered card:
//  - "again" (forgot): 1 XP
//  - "hard": 2 XP
//  - "good": 3 XP
//  - "easy": 4 XP
// Batched sum is logged at end of review session.
export const VOCAB_XP: Record<"again" | "hard" | "good" | "easy", number> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};
