import { NextResponse } from "next/server";
import { generateText } from "@/lib/llm";
import { rolePlayPrompt } from "@/lib/prompts";
import { logError } from "@/lib/db";
import type { ChatMessage, Grade } from "@/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      grade: Grade;
      moduleNumber: number;
      scenario: string;
      studentRole: string;
      aiRole: string;
      studentName?: string;
      messages: ChatMessage[];
    };
    if (!body.scenario || typeof body.grade !== "number") {
      return NextResponse.json({ error: "Missing scenario or grade" }, { status: 400 });
    }
    const { system } = rolePlayPrompt({
      grade: body.grade,
      moduleNumber: body.moduleNumber ?? 1,
      scenario: body.scenario,
      studentRole: body.studentRole,
      aiRole: body.aiRole,
      studentName: body.studentName,
    });
    const { text, provider } = await generateText({
      system,
      messages: body.messages || [],
      temperature: 0.7,
      maxTokens: 200,
    });
    return NextResponse.json({ text, provider });
  } catch (e: any) {
    if (e?.message === "NO_LLM_KEY") {
      return NextResponse.json(
        { error: "Не настроен AI-ключ. Добавь GROQ_API_KEY (или другой) в .env.local." },
        { status: 400 },
      );
    }
    try { logError("ai/roleplay", String(e?.message || e)); } catch {}
    return NextResponse.json({ error: e?.message || "AI error" }, { status: 500 });
  }
}
