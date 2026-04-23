// NOTE: No "server-only" guard — legacy computeBadges() below is used by client
// games page. Server-side helpers (evaluateBadges, BADGES registry) are still
// safe to call from server code.
import type { BadgeDefinition, StudentRecord } from "@/types";

// Registry of all badges the system can unlock.
// Ordered roughly by expected unlock time (early → rare).
export const BADGES: BadgeDefinition[] = [
  {
    id: "first-steps",
    title: "Первые шаги",
    description: "Выполнено первое учебное действие",
    icon: "sparkles",
  },
  {
    id: "streak-3",
    title: "Стрик 3 дня",
    description: "Занимался 3 дня подряд",
    icon: "flame",
  },
  {
    id: "streak-7",
    title: "Стрик 7 дней",
    description: "Целая неделя без пропусков",
    icon: "flame",
  },
  {
    id: "streak-30",
    title: "Стрик 30 дней",
    description: "Месяц ежедневных занятий",
    icon: "crown",
  },
  {
    id: "xp-100",
    title: "100 XP",
    description: "Набрано 100 очков опыта",
    icon: "star",
  },
  {
    id: "xp-500",
    title: "500 XP",
    description: "Набрано 500 очков опыта",
    icon: "star",
  },
  {
    id: "xp-2000",
    title: "2000 XP",
    description: "Набрано 2000 очков опыта",
    icon: "trophy",
  },
  {
    id: "polyglot-25",
    title: "Лексикон: 25 слов",
    description: "25 слов, пройденных без ошибок",
    icon: "award",
  },
  {
    id: "polyglot-100",
    title: "Лексикон: 100 слов",
    description: "100 слов освоено без ошибок",
    icon: "award",
  },
  {
    id: "perfectionist",
    title: "Перфекционист",
    description: "3 упражнения подряд на 100%",
    icon: "target",
  },
  {
    id: "early-bird",
    title: "Ранняя пташка",
    description: "Занятие до 8:00 утра",
    icon: "zap",
  },
  {
    id: "night-owl",
    title: "Ночная сова",
    description: "Занятие после 22:00",
    icon: "zap",
  },
  {
    id: "comeback-kid",
    title: "Возвращение",
    description: "Вернулся после 14+ дней перерыва",
    icon: "rocket",
  },
  {
    id: "mistake-hunter",
    title: "Охотник за ошибками",
    description: "Исправлено 10 своих ошибок",
    icon: "target",
  },
  {
    id: "week-champ",
    title: "Чемпион недели",
    description: "Топ-3 в лиге класса за неделю",
    icon: "trophy",
  },
];

export const BADGE_MAP: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGES.map((b) => [b.id, b]),
);

export interface BadgeContext {
  xp: number;
  streak: number;
  masteredWords: number;
  perfectExerciseStreak: number; // consecutive exercises with 100%
  hourOfDay: number; // 0-23
  daysSinceLastActivity: number | null; // null if this is first activity
  mistakesFixed: number;
}

// Returns badge IDs that should be unlocked given this context.
export function evaluateBadges(ctx: BadgeContext): string[] {
  const unlocked: string[] = [];
  unlocked.push("first-steps");
  if (ctx.streak >= 3) unlocked.push("streak-3");
  if (ctx.streak >= 7) unlocked.push("streak-7");
  if (ctx.streak >= 30) unlocked.push("streak-30");
  if (ctx.xp >= 100) unlocked.push("xp-100");
  if (ctx.xp >= 500) unlocked.push("xp-500");
  if (ctx.xp >= 2000) unlocked.push("xp-2000");
  if (ctx.masteredWords >= 25) unlocked.push("polyglot-25");
  if (ctx.masteredWords >= 100) unlocked.push("polyglot-100");
  if (ctx.perfectExerciseStreak >= 3) unlocked.push("perfectionist");
  if (ctx.hourOfDay < 8) unlocked.push("early-bird");
  if (ctx.hourOfDay >= 22) unlocked.push("night-owl");
  if (ctx.daysSinceLastActivity !== null && ctx.daysSinceLastActivity >= 14) {
    unlocked.push("comeback-kid");
  }
  if (ctx.mistakesFixed >= 10) unlocked.push("mistake-hunter");
  return unlocked;
}

// ───── Legacy client-side helper (used by /student/games HUD) ─────
// Kept for backward compatibility: returns a UI-friendly view based only on
// the cached StudentRecord fields (xp, level, streak). New code should use
// `/api/student/progress` which returns the server-side source of truth.
export interface LegacyBadge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress?: { current: number; target: number };
}

export function computeBadges(student: StudentRecord | null): LegacyBadge[] {
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
