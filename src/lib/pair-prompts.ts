import type { Grade } from "@/types";

/**
 * Lumos moderator prompt: returns a tiny JSON correction for one student
 * utterance inside a pair-roleplay. Designed to be short (1 mistake max,
 * 1-line tip) so it doesn't break conversational flow.
 */
export function pairLumosCorrectionPrompt(grade: Grade) {
  const system = `You are Lumos, a friendly English coach for Russian-speaking learners (grade ${grade}, Spotlight curriculum).
Your role is to gently correct ONE student utterance during a live pair-roleplay between two students.

Rules:
- Output ONLY valid JSON matching this shape (no prose, no markdown fences):
  {
    "ok": true|false,
    "fixed": "<corrected version, in English, only if changes were needed>",
    "tip": "<one short hint in Russian, <=15 words, focused on the most important fix>",
    "tags": ["grammar"|"spelling"|"vocabulary"|"word-order"|"register"|"pronunciation"]
  }
- If the utterance is already good for the student's level, return {"ok": true, "fixed": "", "tip": "", "tags": []}.
- Be encouraging. Never shame the student. If multiple errors exist, pick the most useful single fix.
- Keep "fixed" close to the student's intent — don't rewrite into native-speaker style if their version is acceptable.
- "tip" must be in Russian and concrete (e.g., "Глагол to be в Past — was/were, не is").
- Do not include the role name, scenario, or partner's text in the output.`;
  return { system };
}

/** Light scenario suggestions for the lobby UI. */
export interface PairScenario {
  id: string;
  title: string;
  description: string;
  roleA: string;
  roleB: string;
  minGrade: Grade;
}

export const PAIR_SCENARIOS: PairScenario[] = [
  {
    id: "shop",
    title: "В магазине одежды",
    description: "Покупатель ищет джинсы; продавец помогает с размером и оплатой.",
    roleA: "Customer (Покупатель)",
    roleB: "Shop assistant (Продавец)",
    minGrade: 4,
  },
  {
    id: "cafe",
    title: "В кафе",
    description: "Гость заказывает обед; официант советует и приносит счёт.",
    roleA: "Guest (Гость)",
    roleB: "Waiter (Официант)",
    minGrade: 4,
  },
  {
    id: "directions",
    title: "Дорога в музей",
    description: "Турист спрашивает дорогу; местный житель объясняет маршрут.",
    roleA: "Tourist (Турист)",
    roleB: "Local (Местный житель)",
    minGrade: 5,
  },
  {
    id: "school-day",
    title: "Школьный день",
    description: "Двое одноклассников обсуждают расписание и домашнее задание.",
    roleA: "Student A (Аня)",
    roleB: "Student B (Боря)",
    minGrade: 3,
  },
  {
    id: "doctor",
    title: "На приёме у врача",
    description: "Пациент жалуется на симптомы; врач задаёт вопросы и даёт совет.",
    roleA: "Patient (Пациент)",
    roleB: "Doctor (Врач)",
    minGrade: 6,
  },
  {
    id: "phone",
    title: "Телефонный звонок другу",
    description: "Звонок другу: рассказать о выходных и договориться о встрече.",
    roleA: "Caller (Звонящий)",
    roleB: "Friend (Друг)",
    minGrade: 4,
  },
];

export function getScenario(id: string): PairScenario | null {
  return PAIR_SCENARIOS.find((s) => s.id === id) ?? null;
}
