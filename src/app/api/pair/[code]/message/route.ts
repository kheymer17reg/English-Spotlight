import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  appendMessage,
  findRoomByCode,
  isParticipant,
  messageCount,
  setRoomStatus,
  userSlotInRoom,
} from "@/lib/pair-roleplay-db";
import { generateText } from "@/lib/llm";
import { pairLumosCorrectionPrompt } from "@/lib/pair-prompts";
import { logError } from "@/lib/db";
import type { Grade } from "@/types";

export const runtime = "nodejs";

const MAX_MESSAGES = 30;

interface LumosCorrection {
  ok: boolean;
  fixed: string;
  tip: string;
  tags: string[];
}

function safeParseCorrection(text: string): LumosCorrection | null {
  // Strip markdown fences if the model added them despite instructions.
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

export async function POST(
  req: Request,
  { params }: { params: { code: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const room = findRoomByCode(params.code);
  if (!room) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isParticipant(room, session.user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (room.status !== "active") {
    return NextResponse.json(
      { error: "Сначала второй участник должен подключиться по коду" },
      { status: 400 },
    );
  }
  const slot = userSlotInRoom(room, session.user.id);
  if (!slot) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (slot !== room.currentTurn) {
    return NextResponse.json({ error: "Сейчас ход партнёра" }, { status: 409 });
  }
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });
  }
  if (text.length > 400) {
    return NextResponse.json({ error: "Длиннее 400 символов" }, { status: 400 });
  }

  // Get Lumos correction (best-effort — never blocks the message itself).
  let correction: LumosCorrection | null = null;
  try {
    const { system } = pairLumosCorrectionPrompt(room.grade as Grade);
    const userPrompt =
      `Сценарий: ${room.scenario}\n` +
      `Роль ученика: ${slot === "A" ? room.roleA : room.roleB}\n` +
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
    // No LLM key or transient error — store the message without correction.
    try {
      await logError("pair/message:lumos", String(e));
    } catch {
      /* ignore */
    }
  }

  const message = appendMessage(
    room.id,
    slot,
    text,
    correction as unknown as Record<string, unknown> | null,
  );

  // Soft-cap: if we've hit the max, mark the room as done so the UI shows summary.
  const total = messageCount(room.id);
  if (total >= MAX_MESSAGES) {
    setRoomStatus(room.id, "done");
  }

  return NextResponse.json({
    ok: true,
    message,
    correction,
    nextTurn: slot === "A" ? "B" : "A",
    total,
    finished: total >= MAX_MESSAGES,
  });
}
