import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { scorePronunciation } from "@/lib/pronunciation";
import { logError } from "@/lib/db";

export const runtime = "nodejs";

const GROQ_BASE = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const WHISPER_MODEL = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";

/**
 * POST /api/pronunciation/score
 * FormData: audio (Blob), expected (string)
 *
 * Sends the audio to Groq Whisper for transcription, then scores against the
 * expected sentence. Soft-fails to web-speech-style scoring with empty
 * transcript if Whisper isn't configured — caller can decide to retry locally.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const form = await req.formData();
    const audio = form.get("audio");
    const expected = String(form.get("expected") ?? "").trim();
    if (!expected) {
      return NextResponse.json({ error: "expected text required" }, { status: 400 });
    }
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: "audio blob required" }, { status: 400 });
    }
    if (audio.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "audio too large (>8MB)" }, { status: 413 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured — fallback to in-browser scoring" },
        { status: 503 },
      );
    }

    const ext = audio.type.includes("webm") ? "webm" : audio.type.includes("ogg") ? "ogg" : "wav";
    const upload = new FormData();
    upload.append("file", audio, `speech.${ext}`);
    upload.append("model", WHISPER_MODEL);
    upload.append("language", "en");
    upload.append("response_format", "verbose_json");
    upload.append("temperature", "0");

    const r = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: upload,
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      await logError("/api/pronunciation/score whisper", `${r.status} ${text}`);
      return NextResponse.json(
        { error: `Whisper failed (${r.status})`, fallback: true },
        { status: 502 },
      );
    }

    const data = (await r.json()) as { text?: string };
    const transcript = String(data.text ?? "").trim();
    const result = scorePronunciation(expected, transcript);

    return NextResponse.json({
      ok: true,
      engine: "whisper",
      model: WHISPER_MODEL,
      transcript,
      score: result.score,
      stars: result.stars,
      words: result.words,
    });
  } catch (err) {
    await logError("/api/pronunciation/score", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
