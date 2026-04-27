import { NextResponse } from "next/server";
import { generateText } from "@/lib/llm";
import { buildRagContext } from "@/lib/rag";
import { LUMOS_SYSTEM } from "@/lib/prompts";
import { logError } from "@/lib/db";
import type { ChatMessage } from "@/types";
import { rateLimitForUser, requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  // 60 messages / hour / user. Lumos chat is interactive — be a bit more generous.
  const rl = await rateLimitForUser(req, "ai:chat", { capacity: 60, refillPerMinute: 1 });
  if (!rl.ok) return rl.response;
  try {
    const body = (await req.json()) as { grade?: number; messages: ChatMessage[] };
    const msgs = body.messages || [];
    if (!msgs.length) return NextResponse.json({ error: "Пустой запрос" }, { status: 400 });
    const last = msgs[msgs.length - 1].content;
    const ctx = buildRagContext(last);
    const system =
      `${LUMOS_SYSTEM}\n\n${body.grade ? `Ученик: ${body.grade} класс.` : ""}\n\n${ctx ? `Контекст программы Spotlight:\n${ctx}` : ""}`.trim();
    const { text, provider } = await generateText({
      system,
      messages: msgs,
      temperature: 0.5,
      maxTokens: 800,
    });
    return NextResponse.json({ text, provider });
  } catch (e: any) {
    if (e?.message === "NO_LLM_KEY") {
      return NextResponse.json(
        {
          error:
            "Не настроен AI-ключ. Добавь в .env.local: OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY или ANTHROPIC_API_KEY.",
        },
        { status: 400 },
      );
    }
    try { logError("ai/chat", String(e?.message || e)); } catch {}
    return NextResponse.json({ error: e?.message || "AI error" }, { status: 500 });
  }
}
