import "server-only";

/** In-process pub/sub for class chat (mirrors feed-bus.ts). */

export type ClassChatEvent =
  | { type: "chat.message"; classId: string; messageId: number }
  | { type: "chat.deleted"; classId: string; messageId: number }
  | { type: "ping" };

type Listener = (event: ClassChatEvent) => void;

interface Bus {
  channels: Map<string, Set<Listener>>;
}

const KEY = "__spotlight_class_chat_bus__" as const;

function getBus(): Bus {
  const g = globalThis as unknown as { [KEY]?: Bus };
  if (!g[KEY]) g[KEY] = { channels: new Map() };
  return g[KEY]!;
}

const ch = (classId: string) => `class:${classId}`;

export function subscribeClassChat(classId: string, listener: Listener): () => void {
  const bus = getBus();
  const key = ch(classId);
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

export function publishClassChat(classId: string, event: ClassChatEvent): void {
  const bus = getBus();
  const set = bus.channels.get(ch(classId));
  if (!set || set.size === 0) return;
  for (const l of Array.from(set)) {
    try {
      l(event);
    } catch {
      // isolated
    }
  }
}
