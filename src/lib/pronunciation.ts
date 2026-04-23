// Lightweight pronunciation scoring based on Levenshtein distance.
// Used by the linguaphone tab to turn a Web Speech transcript into a score.

export type PronunciationResult = {
  score: number; // 0..1
  stars: 0 | 1 | 2 | 3 | 4 | 5;
  words: { word: string; ok: boolean }[];
  transcript: string;
};

const PUNCT = /[\p{P}\p{S}]/gu;

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(PUNCT, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] =
        a[i - 1] === b[j - 1]
          ? prevDiag
          : 1 + Math.min(prevDiag, prev[j - 1], prev[j]);
      prevDiag = tmp;
    }
  }
  return prev[b.length];
}

function similar(a: string, b: string): boolean {
  const na = normalise(a);
  const nb = normalise(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const dist = levenshtein(na, nb);
  const max = Math.max(na.length, nb.length);
  // Typographic tolerance: one edit per 4 chars still counts.
  return dist <= Math.max(1, Math.floor(max / 4));
}

export function scorePronunciation(expected: string, transcript: string): PronunciationResult {
  const targets = normalise(expected).split(" ").filter(Boolean);
  const saidRaw = normalise(transcript).split(" ").filter(Boolean);

  const said = [...saidRaw];
  const words = targets.map((t) => {
    const idx = said.findIndex((s) => similar(s, t));
    if (idx >= 0) {
      said.splice(idx, 1);
      return { word: t, ok: true };
    }
    return { word: t, ok: false };
  });

  const ok = words.filter((w) => w.ok).length;
  const score = targets.length ? ok / targets.length : 0;
  const stars = (Math.round(score * 5) as 0 | 1 | 2 | 3 | 4 | 5);
  return { score, stars, words, transcript };
}
