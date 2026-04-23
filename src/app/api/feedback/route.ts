import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_KINDS = new Set(["idea", "bug", "thanks", "other"]);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      kind?: string;
      message?: string;
      pageUrl?: string;
    };
    const message = (body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: "message too long" }, { status: 400 });
    }
    const kind = VALID_KINDS.has(body.kind ?? "") ? body.kind! : "idea";
    const pageUrl = (body.pageUrl ?? "").toString().slice(0, 500) || null;

    const session = await auth().catch(() => null);
    const user = session?.user as
      | { id?: string; role?: string; name?: string | null }
      | undefined;

    const db = getDb();
    const row = db
      .prepare(
        `INSERT INTO feedback (createdAt, kind, userId, userRole, userName, pageUrl, message, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
         RETURNING id, createdAt`,
      )
      .get(
        new Date().toISOString(),
        kind,
        user?.id ?? null,
        user?.role ?? null,
        user?.name ?? null,
        pageUrl,
        message,
      ) as { id: number; createdAt: string };

    return NextResponse.json({ ok: true, id: row.id, createdAt: row.createdAt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth().catch(() => null);
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "teacher") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, createdAt, kind, userId, userRole, userName, pageUrl, message, status
       FROM feedback
       ORDER BY datetime(createdAt) DESC
       LIMIT 200`,
    )
    .all();
  return NextResponse.json({ items: rows });
}

export async function PATCH(req: Request) {
  const session = await auth().catch(() => null);
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "teacher") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as { id?: number; status?: string };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }
    const db = getDb();
    db.prepare(`UPDATE feedback SET status = ? WHERE id = ?`).run(body.status, body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
