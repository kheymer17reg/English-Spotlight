import { NextResponse } from "next/server";
import { logError } from "@/lib/db";
import { rateLimit } from "@/lib/api-auth";

export const runtime = "nodejs";

// Anonymous-friendly endpoint (client-side error reporter), but rate-limit
// per IP so a runaway page can't drown the DB in noise.
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = rateLimit(`errors:${ip}`, { capacity: 30, refillPerMinute: 5 });
  if (!rl.ok) return rl.response;
  const body = (await req.json().catch(() => ({}))) as { where?: string; message?: string };
  // Cap payload sizes to avoid log poisoning.
  const where = (body.where || "client").slice(0, 200);
  const message = (body.message || "unknown").slice(0, 4000);
  logError(where, message);
  return NextResponse.json({ ok: true });
}
