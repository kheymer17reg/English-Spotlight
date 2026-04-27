/**
 * Server-side helpers for protecting API routes.
 *
 * Usage in a route handler:
 *
 *   const guard = await requireAuth();
 *   if (!guard.ok) return guard.response;
 *   const { session } = guard;
 *
 *   const teacher = await requireRole("teacher");
 *   if (!teacher.ok) return teacher.response;
 */
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { findUserById } from "@/lib/db";

type Role = "teacher" | "student" | "parent";

export type AuthGuardOk = {
  ok: true;
  session: Session;
  userId: string;
  role: Role;
};
export type AuthGuardErr = { ok: false; response: NextResponse };
export type AuthGuard = AuthGuardOk | AuthGuardErr;

export async function requireAuth(): Promise<AuthGuard> {
  const session = (await auth()) as Session | null;
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  return {
    ok: true,
    session,
    userId: session.user.id,
    role: (session.user.role ?? "student") as Role,
  };
}

export async function requireRole(role: Role | Role[]): Promise<AuthGuard> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(guard.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return guard;
}

/**
 * Resolve the studentId attached to the signed-in user, if any.
 * Returns null for teachers/parents, or for students whose row has not been linked yet.
 */
export function resolveStudentId(userId: string): string | null {
  const u = findUserById(userId);
  return u?.studentId ?? null;
}

/**
 * Verify that the signed-in student is acting on their own studentId.
 * Returns 403 otherwise. Teachers always pass.
 */
export async function requireOwnStudentOrTeacher(
  studentIdInBody: string,
): Promise<AuthGuard> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;
  if (guard.role === "teacher") return guard;
  const ownId = resolveStudentId(guard.userId);
  if (ownId !== studentIdInBody) {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return guard;
}

/* ─────────────────────────────────── rate limit ─────────────────────────────── */

type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Token-bucket rate limiter (in-memory; per-process).
 * For a tiny single-instance deployment this is enough; behind multiple
 * instances replace with Redis or similar.
 *
 * Returns { ok } if the request is allowed. Otherwise returns a 429 response.
 */
export function rateLimit(
  key: string,
  opts: { capacity: number; refillPerMinute: number },
): { ok: true } | { ok: false; response: NextResponse } {
  const now = Date.now();
  const refillPerMs = opts.refillPerMinute / 60_000;
  const bucket = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: now };
  const elapsed = Math.max(0, now - bucket.updatedAt);
  const tokens = Math.min(opts.capacity, bucket.tokens + elapsed * refillPerMs);
  if (tokens < 1) {
    buckets.set(key, { tokens, updatedAt: now });
    const retryAfter = Math.ceil((1 - tokens) / refillPerMs / 1000);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "rate_limited", retryAfter },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      ),
    };
  }
  buckets.set(key, { tokens: tokens - 1, updatedAt: now });
  return { ok: true };
}

/**
 * Convenience: rate-limit by signed-in user (or IP fallback).
 */
export async function rateLimitForUser(
  req: Request,
  scope: string,
  opts: { capacity: number; refillPerMinute: number },
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const session = (await auth()) as Session | null;
  const id =
    session?.user?.id ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anon";
  return rateLimit(`${scope}:${id}`, opts);
}
