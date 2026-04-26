import "server-only";

/** In-process pub/sub for live quiz (mirrors feed-bus / class-chat-bus). */

export type QuizEvent =
  | { type: "player.joined"; sessionId: string; userId: string; name: string }
  | { type: "player.left"; sessionId: string; userId: string }
  | { type: "player.answered"; sessionId: string; userId: string; qIdx: number; answeredCount: number }
  | { type: "question.advanced"; sessionId: string; qIdx: number }
  | { type: "question.results"; sessionId: string; qIdx: number }
  | { type: "session.finished"; sessionId: string }
  | { type: "ping" };

type Listener = (event: QuizEvent) => void;

interface Bus {
  channels: Map<string, Set<Listener>>;
}

const KEY = "__spotlight_quiz_bus__" as const;

function getBus(): Bus {
  const g = globalThis as unknown as { [KEY]?: Bus };
  if (!g[KEY]) g[KEY] = { channels: new Map() };
  return g[KEY]!;
}

const ch = (sessionId: string) => `quiz:${sessionId}`;

export function subscribeQuiz(sessionId: string, listener: Listener): () => void {
  const bus = getBus();
  const key = ch(sessionId);
  let set = bus.channels.get(key);
  if (!set) {
    set = new Set();
    bus.channels.set(key, set);
  }
  set.add(listener);
  return () => {
    const s = bus.channels.get(key);
    if (!s) return;
    s.delete(listener);
    if (s.size === 0) bus.channels.delete(key);
  };
}

export function publishQuiz(sessionId: string, event: QuizEvent): void {
  const bus = getBus();
  const set = bus.channels.get(ch(sessionId));
  if (!set || set.size === 0) return;
  for (const l of Array.from(set)) {
    try {
      l(event);
    } catch {
      // isolated
    }
  }
}
