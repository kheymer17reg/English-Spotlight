"use client";

/**
 * Studio: high-accuracy pronunciation scoring via Whisper.
 *
 * Records short audio chunks in-browser, posts them to /api/pronunciation/score
 * (Groq Whisper), gets back a transcript + per-word match. Falls back to
 * /student/pronunciation (Web Speech / Azure) if the user is offline or the
 * server can't reach Whisper.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Mic,
  Mic2,
  Square,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { vocabularyByGrade } from "@/lib/vocabulary";
import { READINGS } from "@/lib/readings";
import { logActivity } from "@/lib/activity-client";
import { cn } from "@/lib/utils";
import type { Grade } from "@/types";

type Phrase = { id: string; text: string; hint?: string };

interface ScoreResult {
  ok: true;
  engine: "whisper";
  transcript: string;
  score: number;
  stars: number;
  words: { word: string; ok: boolean }[];
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && s.length <= 110);
}

function buildPhrases(grade: Grade): Phrase[] {
  const out: Phrase[] = [];
  for (const v of vocabularyByGrade(grade).slice(0, 30)) {
    out.push({ id: `w-${v.id}`, text: v.example, hint: `${v.word} — ${v.translation}` });
  }
  for (const r of READINGS.filter((x) => x.grade === grade).slice(0, 8)) {
    splitSentences(r.text).slice(0, 2).forEach((s, i) => {
      out.push({ id: `s-${r.id}-${i}`, text: s, hint: r.title });
    });
  }
  return out.slice(0, 60);
}

export default function SpeakStudioPage() {
  const student = useStore((s) => s.student);
  const grade = (student?.grade ?? 5) as Grade;
  const phrases = useMemo(() => buildPhrases(grade), [grade]);

  const [phraseId, setPhraseId] = useState<string>("");
  const [recState, setRecState] = useState<"idle" | "rec" | "scoring">("idle");
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [supportsRec, setSupportsRec] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phrase = useMemo(
    () => phrases.find((p) => p.id === phraseId) ?? phrases[0] ?? null,
    [phrases, phraseId],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupportsRec(typeof navigator.mediaDevices?.getUserMedia === "function" && typeof MediaRecorder !== "undefined");
  }, []);

  useEffect(() => {
    if (!phraseId && phrases[0]) setPhraseId(phrases[0].id);
  }, [phrases, phraseId]);

  const start = async () => {
    if (!phrase || recState !== "idle") return;
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        for (const t of stream.getTracks()) t.stop();
        void score();
      };
      mediaRef.current = rec;
      rec.start();
      setRecState("rec");
      setSecs(0);
      tickRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch (err) {
      setError(`Не удалось включить микрофон: ${err instanceof Error ? err.message : "ошибка"}`);
      setRecState("idle");
    }
  };

  const stop = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    setRecState("scoring");
  };

  const score = async () => {
    if (!phrase) return;
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (blob.size < 1024) {
      setRecState("idle");
      setError("Слишком короткая запись — попробуй ещё раз");
      return;
    }
    try {
      const form = new FormData();
      form.append("audio", blob, "speech.webm");
      form.append("expected", phrase.text);
      const r = await fetch("/api/pronunciation/score", { method: "POST", body: form });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string; fallback?: boolean };
        setError(
          body.error
            ? `Whisper недоступен (${body.error}). Попробуй вкладку «Лингафон».`
            : "Не удалось оценить — повтори",
        );
        setRecState("idle");
        return;
      }
      const body = (await r.json()) as ScoreResult;
      setResult(body);
      setRecState("idle");
      if (student?.id) {
        const correct = body.words.filter((w) => w.ok).length;
        const total = Math.max(body.words.length, 1);
        await logActivity({
          studentId: student.id,
          activityType: "pronunciation",
          skill: "speaking",
          xp: Math.round(5 + body.score * 20),
          correct,
          total,
          meta: { engine: "whisper", phraseId: phrase.id, score: body.score },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети");
      setRecState("idle");
    }
  };

  const speak = () => {
    if (!phrase || typeof window === "undefined") return;
    const u = new SpeechSynthesisUtterance(phrase.text);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft">
            <Mic2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold leading-tight">Студия речи</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Точная оценка произношения через Whisper. Запиши фразу на 5–15 секунд — получишь
              транскрипт и подсветку слов.
            </p>
          </div>
        </div>
      </div>

      {!supportsRec ? (
        <Card>
          <CardContent className="space-y-2 p-5 text-sm">
            <div className="font-semibold">Браузер не поддерживает запись</div>
            <p className="text-muted-foreground">
              Открой в Chrome / Safari / Edge на компьютере или телефоне. Альтернатива —{" "}
              <Link href="/student/pronunciation" className="text-primary underline">Лингафон</Link>{" "}
              на Web Speech API.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Фраза для тренировки</label>
            <Select value={phraseId} onChange={(e) => setPhraseId(e.target.value)}>
              {phrases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.text.length > 70 ? `${p.text.slice(0, 70)}…` : p.text}
                </option>
              ))}
            </Select>
          </div>

          {phrase ? (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl">{phrase.text}</div>
                  {phrase.hint ? (
                    <div className="mt-1 text-xs text-muted-foreground">{phrase.hint}</div>
                  ) : null}
                </div>
                <Button variant="outline" size="sm" onClick={speak} className="gap-1.5">
                  <Volume2 className="h-4 w-4" /> Эталон
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            {recState === "idle" ? (
              <Button onClick={start} disabled={!supportsRec} className="gap-2">
                <Mic className="h-4 w-4" /> Записать
              </Button>
            ) : recState === "rec" ? (
              <Button onClick={stop} variant="destructive" className="gap-2">
                <Square className="h-4 w-4" /> Остановить ({secs}с)
              </Button>
            ) : (
              <Button disabled className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Оцениваю…
              </Button>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {recState === "rec" ? (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /> Запись идёт
                </span>
              ) : null}
            </div>
          </div>
          {error ? <div className="text-xs text-rose-600">{error}</div> : null}
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-display text-2xl font-semibold">
                {Math.round(result.score * 100)}%
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-lg",
                      i < result.stars ? "text-amber-500" : "text-muted-foreground/30",
                    )}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Что услышал Whisper:</div>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm italic">
                {result.transcript || <span className="text-muted-foreground">тишина</span>}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs text-muted-foreground">Эталон с подсветкой:</div>
              <div className="flex flex-wrap gap-1.5">
                {result.words.map((w, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-md px-2 py-1 font-medium",
                      w.ok
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                    )}
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1 text-[10px]">
                <CheckCircle2 className="h-3 w-3" /> Whisper
              </Badge>
              <span>попадание {result.words.filter((w) => w.ok).length}/{result.words.length} слов</span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
