import { NextResponse } from "next/server";
import {
  deleteBoardNote,
  getBoardNote,
  listBoardNotes,
  upsertBoardNote,
  type BoardNote,
} from "@/lib/db";
import { uid } from "@/lib/utils";
import { requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// All board operations are teacher-only — these are private lesson whiteboards.
export async function GET(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const note = getBoardNote(id);
    if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ note });
  }
  const items = listBoardNotes();
  return NextResponse.json({
    notes: items.map((n) => ({
      id: n.id,
      title: n.title,
      thumbnail: n.thumbnail,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })),
  });
}

export async function POST(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
  const body = (await req.json()) as Partial<BoardNote>;
  if (!body.title || !body.data) {
    return NextResponse.json({ error: "title and data required" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const note: BoardNote = {
    id: body.id || uid("note"),
    title: body.title,
    data: body.data,
    thumbnail: body.thumbnail ?? null,
    createdAt: body.createdAt || now,
    updatedAt: now,
  };
  upsertBoardNote(note);
  return NextResponse.json({ note: { ...note, data: undefined } });
}

export async function DELETE(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteBoardNote(id);
  return NextResponse.json({ ok: true });
}
