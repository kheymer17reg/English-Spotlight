import "server-only";
import { logError } from "@/lib/db";

const GROQ_BASE = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

export interface VisionResult {
  ocrText: string;
  aiFeedback: string;
  aiSuggestedGrade: number | null;
}

const SYSTEM_PROMPT = `Ты — методист английского языка. Тебе дают фото домашней работы ученика 2–8 класса.
Сначала аккуратно расшифруй то, что написано на фото (OCR). Затем дай короткий разбор:
2–4 пункта по грамматике/орфографии/пунктуации (на русском, дружелюбно), и предложи оценку 2–5.
Верни строго JSON по схеме:
{"ocr":"<расшифровка>", "feedback":"<разбор маркированным списком через перенос строки>", "grade": <2|3|4|5>}
Если фото не содержит читаемого текста — верни ocr пустую строку, grade null.`;

export async function visionGrade(dataUrl: string): Promise<VisionResult | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Распознай текст и оцени работу. Ответь JSON." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!r.ok) {
      await logError("photo-hw vision", `${r.status} ${await r.text().catch(() => "")}`);
      return null;
    }
    const data = (await r.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) return null;
    let parsed: { ocr?: string; feedback?: string; grade?: number | null };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    const grade = typeof parsed.grade === "number" && parsed.grade >= 2 && parsed.grade <= 5 ? parsed.grade : null;
    return {
      ocrText: typeof parsed.ocr === "string" ? parsed.ocr : "",
      aiFeedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
      aiSuggestedGrade: grade,
    };
  } catch (err) {
    await logError("photo-hw vision", String(err));
    return null;
  }
}
