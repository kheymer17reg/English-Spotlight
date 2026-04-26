import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Resolve student id → display name. Restricted to teachers; only resolves
 * users that share at least one class with the requesting teacher.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 200);
  if (ids.length === 0) return NextResponse.json({ students: [] });
  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT DISTINCT u.id, u.name
       FROM users u
       INNER JOIN group_members gm ON gm.userId = u.id
       INNER JOIN groups g ON g.id = gm.groupId
       WHERE g.teacherId = ? AND u.id IN (${placeholders})`,
    )
    .all(session.user.id, ...ids) as { id: string; name: string }[];
  return NextResponse.json({ students: rows });
}
