#!/usr/bin/env node
// Batch-seed methodical lesson plans.
// 1. POST /api/lessons to ensure all 196 stubs exist.
// 2. For each stub, POST /api/lessons/generate with rate-limited concurrency.
// Usage: node scripts/seed-methodical.mjs [--only-stub] [--concurrency=2] [--limit=0]

const BASE = process.env.BASE_URL ?? "http://localhost:3010";
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  }),
);
const ONLY_STUB = args["only-stub"] !== undefined;
const CONCURRENCY = Math.max(1, Math.min(8, Number(args.concurrency ?? 2)));
const LIMIT = Number(args.limit ?? 0);
const DELAY_MS = Number(args.delay ?? 300);

async function http(path, init) {
  const r = await fetch(`${BASE}${path}`, init);
  const text = await r.text();
  try {
    return { status: r.status, ok: r.ok, data: JSON.parse(text) };
  } catch {
    return { status: r.status, ok: r.ok, data: text };
  }
}

async function main() {
  console.log(`[seed] base=${BASE} concurrency=${CONCURRENCY} only-stub=${ONLY_STUB} limit=${LIMIT || "∞"}`);

  // Ensure stubs
  const seedRes = await http("/api/lessons", { method: "POST" });
  console.log(`[seed] stubs ensured: status=${seedRes.status} total=${seedRes.data?.total}`);

  // List all lessons
  const listRes = await http("/api/lessons", { cache: "no-store" });
  if (!listRes.ok) {
    console.error(`[seed] failed to list: ${listRes.status}`);
    process.exit(1);
  }
  const lessons = listRes.data.lessons;
  const targets = ONLY_STUB ? lessons.filter((l) => l.status === "stub") : lessons;
  const queue = LIMIT > 0 ? targets.slice(0, LIMIT) : targets;
  console.log(`[seed] total=${lessons.length} stubs=${targets.length} queued=${queue.length}`);

  let ok = 0;
  let fail = 0;
  let idx = 0;

  async function worker(wid) {
    while (idx < queue.length) {
      const my = idx++;
      const l = queue[my];
      const started = Date.now();
      try {
        const r = await http("/api/lessons/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: l.id }),
        });
        if (r.ok) {
          ok++;
          console.log(`[w${wid}] ${my + 1}/${queue.length} OK  ${l.id} · ${Date.now() - started}ms · ${l.title.slice(0, 60)}`);
        } else {
          fail++;
          const err = typeof r.data === "object" ? r.data?.error : r.data;
          console.warn(`[w${wid}] ${my + 1}/${queue.length} FAIL ${l.id} · ${r.status} · ${String(err).slice(0, 120)}`);
          if (r.status === 429 || r.status === 503) {
            await new Promise((resolve) => setTimeout(resolve, 30_000));
          }
        }
      } catch (e) {
        fail++;
        console.warn(`[w${wid}] ${my + 1}/${queue.length} EXCEPTION ${l.id} · ${e?.message ?? e}`);
      }
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  console.log(`[seed] done: ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
