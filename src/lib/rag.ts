import { CURRICULUM } from "@/lib/curriculum";
import type { CurriculumModule } from "@/types";

// Tiny BM25-like keyword retriever over the curriculum. Good enough to
// ground Lumos's replies in the Spotlight program without external services.

export interface RagHit {
  module: CurriculumModule;
  score: number;
  snippet: string;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((x) => x.length > 1);
}

export function searchCurriculum(query: string, limit = 3): RagHit[] {
  const q = tokenize(query);
  if (!q.length) return [];
  const hits = CURRICULUM.map((m) => {
    const body = [m.title, ...m.topics, ...m.grammar, ...m.vocabulary].join(" ");
    const tokens = tokenize(body);
    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
    let score = 0;
    for (const t of q) {
      const c = counts.get(t) ?? 0;
      if (!c) continue;
      score += Math.log(1 + c) * (2.2 / (1.2 + c / Math.max(1, tokens.length)));
    }
    return { module: m, score, snippet: body.slice(0, 180) };
  })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return hits;
}

export function buildRagContext(query: string): string {
  const hits = searchCurriculum(query, 3);
  if (!hits.length) return "";
  return hits
    .map(
      (h) =>
        `• Класс ${h.module.grade}, модуль ${h.module.number} «${h.module.title}». Грамматика: ${h.module.grammar.join("; ")}. Лексика: ${h.module.vocabulary.join(", ")}.`,
    )
    .join("\n");
}
