// SM-2 spaced repetition, adapted for vocabulary flashcards.
// Stored per-word in localStorage, keyed by student+grade+wordId.
// Quality map (user-facing buttons → SM-2 quality score):
//   "again"  → 1   (reset interval to 0, reps=0)
//   "hard"   → 3   (small interval bump)
//   "good"   → 4   (standard)
//   "easy"   → 5   (bigger bump, higher EF growth)

export interface SrCard {
  id: string;          // word id
  ef: number;          // easiness factor (min 1.3)
  interval: number;    // days until next review
  reps: number;        // consecutive successful reps
  due: string;         // ISO date of next review
  lastReviewed: string | null;
  lapses: number;      // how many times it reset
}

export type SrQuality = "again" | "hard" | "good" | "easy";

const QUALITY_SCORE: Record<SrQuality, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

export function createCard(id: string): SrCard {
  return {
    id,
    ef: 2.5,
    interval: 0,
    reps: 0,
    due: todayISO(),
    lastReviewed: null,
    lapses: 0,
  };
}

export function schedule(card: SrCard, quality: SrQuality, now = new Date()): SrCard {
  const q = QUALITY_SCORE[quality];
  let { ef, interval, reps, lapses } = card;

  if (q < 3) {
    reps = 0;
    interval = 0;
    lapses += 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = quality === "easy" ? 4 : 2;
    else interval = Math.max(1, Math.round(interval * ef));
    reps += 1;
  }

  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  if (quality === "easy") ef = Math.min(3.0, ef + 0.15);

  const dueDate = new Date(now);
  dueDate.setHours(0, 0, 0, 0);
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    ...card,
    ef,
    interval,
    reps,
    lapses,
    due: dueDate.toISOString().slice(0, 10),
    lastReviewed: now.toISOString(),
  };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isDue(card: SrCard, today = todayISO()): boolean {
  return card.due <= today;
}

export function masteryLabel(card: SrCard): "new" | "learning" | "review" | "mastered" {
  if (card.reps === 0) return "new";
  if (card.interval < 7) return "learning";
  if (card.interval < 30) return "review";
  return "mastered";
}

// --- Storage ---

const KEY_PREFIX = "spotlight.sr.v1.";

function storageKey(studentId: string, grade: number): string {
  return `${KEY_PREFIX}${studentId}.g${grade}`;
}

export function loadDeck(studentId: string, grade: number): Record<string, SrCard> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(studentId, grade));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SrCard>;
  } catch {
    return {};
  }
}

export function saveDeck(studentId: string, grade: number, deck: Record<string, SrCard>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(studentId, grade), JSON.stringify(deck));
  } catch {
    /* quota, ignore */
  }
}

export function upsertCard(
  studentId: string,
  grade: number,
  wordId: string,
  quality: SrQuality,
): SrCard {
  const deck = loadDeck(studentId, grade);
  const existing = deck[wordId] ?? createCard(wordId);
  const next = schedule(existing, quality);
  deck[wordId] = next;
  saveDeck(studentId, grade, deck);
  return next;
}

export function deckStats(deck: Record<string, SrCard>, allWordIds: string[]) {
  const today = todayISO();
  let dueNow = 0;
  let learning = 0;
  let review = 0;
  let mastered = 0;
  let untouched = 0;
  for (const id of allWordIds) {
    const c = deck[id];
    if (!c) {
      untouched += 1;
      dueNow += 1;
      continue;
    }
    if (c.due <= today) dueNow += 1;
    const label = masteryLabel(c);
    if (label === "learning") learning += 1;
    else if (label === "review") review += 1;
    else if (label === "mastered") mastered += 1;
  }
  return { dueNow, learning, review, mastered, untouched, total: allWordIds.length };
}
