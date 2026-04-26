import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { generateText } from "@/lib/llm";
import { pairLumosCorrectionPrompt } from "@/lib/pair-prompts";
import { appendChatMessage, listChat } from "@/lib/class-chat-db";
import { logError } from "@/lib/db";
import type { Grade } from "@/types";

export const runtime = "nodejs";

interface LumosCorrection {
  ok: boolean;
  fixed: string;
  tip: string;
  tags: string[];
}

function safeParseCorrection(text: string): LumosCorrection | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const v = JSON.parse(cleaned) as Partial<LumosCorrection>;
    return {
      ok: typeof v.ok === "boolean" ? v.ok : true,
      fixed: typeof v.fixed === "string" ? v.fixed : "",
      tip: typeof v.tip === "string" ? v.tip : "",
      tags: Array.isArray(v.tags) ? v.tags.map((t) => String(t)) : [],
    };
  } catch {
    return null;
  }
}

interface MembershipRow {
  role: "teacher" | "student";
}

function membership(userId: string, classId: string): MembershipRow | null {
  const db = getDb();
  return (db
    .prepare(
      `SELECT role FROM group_members WHERE groupId = ? AND userId = ? LIMIT 1`,
    )
    .get(classId, userId) as MembershipRow | undefined) ?? null;
}

function classGrade(classId: string): Grade {
  const db = getDb();
  const row = db
    .prepare(`SELECT grade FROM groups WHERE id = ?`)
    .get(classId) as { grade: number } | undefined;
  return ((row?.grade ?? 5) as number) as Grade;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!membership(session.user.id, params.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const before = Number(url.searchParams.get("before") ?? 0) || undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100) || 100, 200);
  const messages = listChat(params.id, limit, before);
  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const member = membership(session.user.id, params.id);
  if (!member) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ error: "Длиннее 500 символов" }, { status: 400 });
  }

  let correction: LumosCorrection | null = null;
  // Only auto-correct student messages — teacher messages (announcements) skip
  // Lumos to keep moderator authority intact.
  if (member.role === "student") {
    try {
      const grade = classGrade(params.id);
      const { system } = pairLumosCorrectionPrompt(grade);
      const userPrompt =
        `Контекст: классный чат, обсуждение по-английски.\n` +
        `Сообщение ученика: ${text}\n\n` +
        `Верни JSON по схеме.`;
      const { text: raw } = await generateText({
        system,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.2,
        maxTokens: 200,
        json: true,
      });
      correction = safeParseCorrection(raw);
    } catch (e) {
      try {
        await logError("classes/chat:lumos", String(e));
      } catch {
        /* ignore */
      }
    }
  }

  const message = appendChatMessage({
    classId: params.id,
    authorUserId: session.user.id,
    authorRole: member.role,
    text,
    correction: correction as unknown as Record<string, unknown> | null,
  });

  return NextResponse.json({
    ok: true,
    message: {
      ...message,
      authorName: session.user.name ?? "Ты",
    },
    correction,
  });
}
