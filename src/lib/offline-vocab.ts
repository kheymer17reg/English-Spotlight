/**
 * Offline vocabulary cache via IndexedDB.
 *
 * Stores word packs (a snapshot of `VocabWord[]` for a class+optional module)
 * so the student can keep drilling flashcards without connectivity. The same
 * file also tracks lightweight per-word SR (spaced-repetition) state — known /
 * learning, last reviewed, next due — so that progress survives page reloads
 * even when the server is unreachable.
 *
 * No external dependency: hand-rolled IDB wrapper.
 */
import type { VocabWord } from "@/types";

const DB_NAME = "spotlight-offline";
const DB_VERSION = 1;
const STORE_PACKS = "vocab_packs";
const STORE_PROGRESS = "vocab_progress";

export interface VocabPack {
  /** `grade-<n>` for full-grade pack, `grade-<n>-mod-<m>` for module pack. */
  id: string;
  label: string;
  grade: number;
  module?: number;
  words: VocabWord[];
  savedAt: string;
  /** Words count cache (== words.length). */
  size: number;
}

export type WordStatus = "new" | "learning" | "known";

export interface WordProgress {
  /** `<packId>|<wordId>` */
  key: string;
  packId: string;
  wordId: string;
  status: WordStatus;
  reviews: number;
  lastReviewed: string;
  /** ISO timestamp when this card is due again (for tomorrow / next week). */
  nextDue: string;
}

function isAvailable(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isAvailable()) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PACKS)) {
        db.createObjectStore(STORE_PACKS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
        const store = db.createObjectStore(STORE_PROGRESS, { keyPath: "key" });
        store.createIndex("by-pack", "packId");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
  });
}

function tx<T>(
  storeNames: string[],
  mode: IDBTransactionMode,
  run: (stores: IDBObjectStore[]) => Promise<T> | T,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(storeNames, mode);
        const stores = storeNames.map((n) => t.objectStore(n));
        let result: T;
        Promise.resolve(run(stores))
          .then((r) => {
            result = r;
          })
          .catch((err) => {
            t.abort();
            reject(err);
          });
        t.oncomplete = () => resolve(result);
        t.onabort = () => reject(t.error ?? new Error("IDB tx aborted"));
        t.onerror = () => reject(t.error ?? new Error("IDB tx error"));
      }),
  );
}

function reqAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB request failed"));
  });
}

export async function savePack(pack: Omit<VocabPack, "savedAt" | "size">): Promise<VocabPack> {
  if (!isAvailable()) throw new Error("OFFLINE_UNAVAILABLE");
  const full: VocabPack = {
    ...pack,
    size: pack.words.length,
    savedAt: new Date().toISOString(),
  };
  await tx([STORE_PACKS], "readwrite", async ([store]) => {
    await reqAsPromise(store.put(full));
  });
  return full;
}

export async function listPacks(): Promise<VocabPack[]> {
  if (!isAvailable()) return [];
  return tx([STORE_PACKS], "readonly", async ([store]) => {
    const all = await reqAsPromise(store.getAll() as IDBRequest<VocabPack[]>);
    return all.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }).catch(() => []);
}

export async function getPack(id: string): Promise<VocabPack | null> {
  if (!isAvailable()) return null;
  return tx([STORE_PACKS], "readonly", async ([store]) => {
    const r = await reqAsPromise(store.get(id) as IDBRequest<VocabPack | undefined>);
    return r ?? null;
  }).catch(() => null);
}

export async function deletePack(id: string): Promise<void> {
  if (!isAvailable()) return;
  await tx([STORE_PACKS, STORE_PROGRESS], "readwrite", async ([packs, progress]) => {
    await reqAsPromise(packs.delete(id));
    // Wipe related progress entries.
    const idx = progress.index("by-pack");
    const keys = await reqAsPromise(idx.getAllKeys(IDBKeyRange.only(id)) as IDBRequest<IDBValidKey[]>);
    for (const k of keys) {
      await reqAsPromise(progress.delete(k));
    }
  });
}

export async function getProgress(packId: string): Promise<WordProgress[]> {
  if (!isAvailable()) return [];
  return tx([STORE_PROGRESS], "readonly", async ([store]) => {
    const idx = store.index("by-pack");
    return reqAsPromise(idx.getAll(IDBKeyRange.only(packId)) as IDBRequest<WordProgress[]>);
  }).catch(() => []);
}

const KNOWN_REVIEWS_THRESHOLD = 3;
const DAY_MS = 86_400_000;

/** Compute next due based on review count (simple Leitner-like). */
function nextDueFor(reviews: number, correct: boolean): string {
  if (!correct) return new Date(Date.now() + 5 * 60_000).toISOString(); // 5 min
  const intervals = [DAY_MS, 2 * DAY_MS, 4 * DAY_MS, 7 * DAY_MS, 14 * DAY_MS, 30 * DAY_MS];
  const idx = Math.min(reviews, intervals.length - 1);
  return new Date(Date.now() + intervals[idx]).toISOString();
}

export async function recordReview(
  packId: string,
  wordId: string,
  correct: boolean,
): Promise<WordProgress> {
  if (!isAvailable()) throw new Error("OFFLINE_UNAVAILABLE");
  const key = `${packId}|${wordId}`;
  return tx([STORE_PROGRESS], "readwrite", async ([store]) => {
    const existing = await reqAsPromise(
      store.get(key) as IDBRequest<WordProgress | undefined>,
    );
    const reviews = (existing?.reviews ?? 0) + 1;
    const status: WordStatus = correct
      ? reviews >= KNOWN_REVIEWS_THRESHOLD
        ? "known"
        : "learning"
      : "learning";
    const next: WordProgress = {
      key,
      packId,
      wordId,
      status,
      reviews,
      lastReviewed: new Date().toISOString(),
      nextDue: nextDueFor(reviews, correct),
    };
    await reqAsPromise(store.put(next));
    return next;
  });
}

export interface PackStats {
  total: number;
  known: number;
  learning: number;
  newCount: number;
  dueNow: number;
}

export async function packStats(pack: VocabPack): Promise<PackStats> {
  const progress = await getProgress(pack.id);
  const byWord = new Map(progress.map((p) => [p.wordId, p]));
  const now = Date.now();
  let known = 0;
  let learning = 0;
  let newCount = 0;
  let dueNow = 0;
  for (const w of pack.words) {
    const p = byWord.get(w.id);
    if (!p) {
      newCount += 1;
      dueNow += 1;
      continue;
    }
    if (p.status === "known") known += 1;
    else learning += 1;
    if (new Date(p.nextDue).getTime() <= now) dueNow += 1;
  }
  return { total: pack.words.length, known, learning, newCount, dueNow };
}

/** Pick the next batch of words to drill, prioritising due + new. */
export function selectDueWords(pack: VocabPack, progress: WordProgress[], limit = 12): VocabWord[] {
  const byWord = new Map(progress.map((p) => [p.wordId, p]));
  const now = Date.now();
  const scored = pack.words.map((w) => {
    const p = byWord.get(w.id);
    if (!p) return { w, score: 100 };
    if (p.status === "known") return { w, score: 1 };
    const overdue = (now - new Date(p.nextDue).getTime()) / DAY_MS;
    return { w, score: 50 + Math.max(0, overdue) * 10 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.w);
}
