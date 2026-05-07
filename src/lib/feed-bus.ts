import "server-only";

/**
 * In-process pub/sub for live feed updates. Replaces 60s polling with a small
 * SSE stream — perfect for our single-Node deployment. If we ever go multi-node
 * we'll swap this with Redis pub/sub or a cluster-aware bus, but for now the
 * dev box and tiny prod runs comfortably.
 *
 * Channels are class IDs ("class:<id>"). Subscribers get `{ type, postId, ... }`
 * payloads as serialized JSON. We don't store history here — the page hydrates
 * via /api/feed once and then patches via stream events.
 */

export type FeedEvent =
  | { type: "post.created"; postId: number; classId: string }
  | { type: "post.deleted"; postId: number; classId: string }
  | {
      type: "reaction.changed";
      postId: number;
      classId: string;
      emoji: string;
      delta: 1 | -1;
      userId: string;
    }
  | { type: "ping" };

type Listener = (event: FeedEvent) => void;

interface Bus {
  channels: Map<string, Set<Listener>>;
}

const GLOBAL_KEY = "__spotlight_feed_bus__" as const;

function getBus(): Bus {
  const g = globalThis as unknown as { [GLOBAL_KEY]?: Bus };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { channels: new Map() };
  }
  return g[GLOBAL_KEY]!;
}

function chKey(classId: string): string {
  return `class:${classId}`;
}

export function subscribeFeed(classId: string, listener: Listener): () => void {
  const bus = getBus();
  const key = chKey(classId);
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

export function publishFeed(classId: string, event: FeedEvent): void {
  const bus = getBus();
  const set = bus.channels.get(chKey(classId));
  if (!set || set.size === 0) return;
  // Copy to avoid mutation while iterating.
  for (const l of Array.from(set)) {
    try {
      l(event);
    } catch {
      // Listener errors are isolated — never break siblings.
    }
  }
}

/** Number of active SSE clients per class — handy for diagnostics. */
export function feedListenerCount(classId: string): number {
  return getBus().channels.get(chKey(classId))?.size ?? 0;
}
