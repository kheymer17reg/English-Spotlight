import { NextResponse } from "next/server";
import { uid } from "@/lib/utils";
import {
  deleteHomework,
  insertHomework,
  listHomework,
  completionsForHomework,
  type Homework,
} from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gradeRaw = searchParams.get("grade");
  const grade = gradeRaw ? Number(gradeRaw) : undefined;
  const items = listHomework(grade);
  // Attach completion counts so the teacher sees progress next to each row.
  const withCompletions = items.map((h) => ({
    ...h,
    completions: completionsForHomework(h.id),
  }));
  return NextResponse.json({ items: withCompletions });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Homework>;
  if (!body.grade || !body.title || !body.resourceType) {
    return NextResponse.json({ error: "grade, title and resourceType are required" }, { status: 400 });
  }
  const h: Homework = {
    id: body.id || uid("hw"),
    grade: Number(body.grade),
    title: String(body.title),
    instructions: body.instructions ?? null,
    resourceType: body.resourceType,
    resourceId: body.resourceId ?? null,
    resourcePayload: body.resourcePayload ?? null,
    dueDate: body.dueDate ?? null,
    createdAt: body.createdAt || new Date().toISOString(),
  };
  insertHomework(h);
  return NextResponse.json({ homework: h });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  deleteHomework(id);
  return NextResponse.json({ ok: true });
}
