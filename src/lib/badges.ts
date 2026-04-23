// Achievement badges, awarded by reading student state (xp, streak, level).
// Keep pure + deterministic; UI re-computes on every render.

import type { StudentRecord } from "@/types";

export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress?: { current: number; target: number };
}

export function computeBadges(student: StudentRecord | null): Badge[] {
  const xp = student?.xp ?? 0;
  const level = student?.level ?? 1;
  const streak = student?.streak ?? 0;

  return [
    {
      id: "xp-100",
      title: "Первая сотня",
      description: "Набери 100 XP",
      emoji: "🌱",
      unlocked: xp >= 100,
      progress: { current: Math.min(xp, 100), target: 100 },
    },
    {
      id: "xp-500",
      title: "Полутысячник",
      description: "Набери 500 XP",
      emoji: "⭐",
      unlocked: xp >= 500,
      progress: { current: Math.min(xp, 500), target: 500 },
    },
    {
      id: "xp-2000",
      title: "Эксперт",
      description: "Набери 2000 XP",
      emoji: "🏆",
      unlocked: xp >= 2000,
      progress: { current: Math.min(xp, 2000), target: 2000 },
    },
    {
      id: "level-5",
      title: "Уровень 5",
      description: "Дойди до 5 уровня",
      emoji: "🚀",
      unlocked: level >= 5,
      progress: { current: Math.min(level, 5), target: 5 },
    },
    {
      id: "streak-3",
      title: "Три дня подряд",
      description: "Держи серию 3 дня",
      emoji: "🔥",
      unlocked: streak >= 3,
      progress: { current: Math.min(streak, 3), target: 3 },
    },
    {
      id: "streak-7",
      title: "Неделя подряд",
      description: "Держи серию 7 дней",
      emoji: "🌟",
      unlocked: streak >= 7,
      progress: { current: Math.min(streak, 7), target: 7 },
    },
    {
      id: "streak-30",
      title: "Месяц подряд",
      description: "Держи серию 30 дней",
      emoji: "💎",
      unlocked: streak >= 30,
      progress: { current: Math.min(streak, 30), target: 30 },
    },
  ];
}
