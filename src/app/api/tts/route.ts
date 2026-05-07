import { NextResponse } from "next/server";
import { rateLimitForUser, requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Quality TTS with provider chain:
 *   ru-* text  → Yandex SpeechKit v1 (Api-Key auth)
 *   en-* text  → Groq Orpheus (if YC not configured or lang != ru)
 *   otherwise  → 503 so the client falls back to Web Speech
 *
 * Env:
 *   YANDEX_SPEECHKIT_API_KEY — Yandex Cloud SpeechKit API key
 *   YANDEX_FOLDER_ID         — Yandex Cloud folder id (required with API key auth)
 *   GROQ_API_KEY             — Groq key with Orpheus terms accepted
 *   GROQ_TTS_MODEL           — override the default Orpheus model (optional)
 *
 * Orpheus requires one-time terms acceptance at
 * https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english
 */

const GROQ_MODEL = "canopylabs/orpheus-v1-english";
const GROQ_VOICES = new Set([
  "troy",
  "hannah",
  "austin",
  "mia",
  "jon",
  "mike",
]);
const YANDEX_VOICES: Record<string, string> = {
  "ru-RU": "alena",
  "en-US": "madison",
};

function pickLang(explicit: string | undefined, text: string): "ru-RU" | "en-US" {
  if (explicit === "ru" || explicit === "ru-RU") return "ru-RU";
  if (explicit === "en" || explicit === "en-US") return "en-US";
  // Autodetect: if cyrillic present → ru, else en.
  return /[\u0400-\u04FF]/.test(text) ? "ru-RU" : "en-US";
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  // 200 TTS calls / hour / user — generous (one click per word) but still
  // bounded so a runaway script can't drain the SpeechKit budget.
  const rl = await rateLimitForUser(req, "tts", { capacity: 200, refillPerMinute: 5 });
  if (!rl.ok) return rl.response;
  try {
    const body = (await req.json()) as {
      text?: string;
      voice?: string;
      lang?: string;
    };
    const text = (body.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: "text too long (max 2000)" }, { status: 400 });
    }
    const lang = pickLang(body.lang, text);

    const yaKey = process.env.YANDEX_SPEECHKIT_API_KEY;
    const yaFolder = process.env.YANDEX_FOLDER_ID;
    const groqKey = process.env.GROQ_API_KEY;

    // 1) Yandex — for RU always, and EN if Groq is unavailable.
    const preferYandex = !!(yaKey && yaFolder) && (lang === "ru-RU" || !groqKey);
    if (preferYandex && yaKey && yaFolder) {
      const yaVoice = YANDEX_VOICES[lang] ?? YANDEX_VOICES["ru-RU"];
      const params = new URLSearchParams({
        text,
        lang,
        voice: yaVoice,
        folderId: yaFolder,
        format: "oggopus",
      });
      const r = await fetch(
        "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize",
        {
          method: "POST",
          headers: {
            Authorization: `Api-Key ${yaKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
      );
      if (r.ok) {
        const buf = await r.arrayBuffer();
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "Content-Type": "audio/ogg",
            "Cache-Control": "public, max-age=3600",
            "X-TTS-Provider": "yandex",
          },
        });
      }
      const detail = await r.text();
      // On Yandex failure for EN, try Groq as second chance; otherwise surface 503.
      if (lang === "en-US" && groqKey) {
        // fall through to Groq
      } else {
        return NextResponse.json(
          {
            error: "tts_upstream_error",
            provider: "yandex",
            upstream_status: r.status,
            detail: detail.slice(0, 400),
          },
          { status: r.status === 401 || r.status === 403 ? 503 : r.status },
        );
      }
    }

    // 2) Groq Orpheus — EN only.
    if (lang === "en-US" && groqKey) {
      const voice = GROQ_VOICES.has(body.voice ?? "") ? body.voice! : "hannah";
      const model = process.env.GROQ_TTS_MODEL ?? GROQ_MODEL;
      const r = await fetch(
        "https://api.groq.com/openai/v1/audio/speech",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            voice,
            input: text,
            response_format: "wav",
          }),
        },
      );
      if (r.ok) {
        const buf = await r.arrayBuffer();
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "Content-Type": "audio/wav",
            "Cache-Control": "public, max-age=3600",
            "X-TTS-Provider": "groq-orpheus",
          },
        });
      }
      const detail = await r.text();
      // 400 (terms) / 403 (permission) → fall back to Web Speech
      const status = r.status === 400 || r.status === 403 ? 503 : r.status;
      return NextResponse.json(
        {
          error: "tts_upstream_error",
          provider: "groq-orpheus",
          upstream_status: r.status,
          detail: detail.slice(0, 400),
        },
        { status },
      );
    }

    // 3) No provider available → let client use Web Speech
    return NextResponse.json(
      {
        error: "tts_unavailable",
        reason:
          "No server-side TTS configured for this language. Falling back to Web Speech.",
        lang,
      },
      { status: 503 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
