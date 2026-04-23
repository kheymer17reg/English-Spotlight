"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, Mic, MicOff, Sparkles, Star, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { DIALOGUES } from "@/lib/dialogues";
import { READINGS } from "@/lib/readings";
import { vocabularyByGrade } from "@/lib/vocabulary";
import { scorePronunciation, type PronunciationResult } from "@/lib/pronunciation";
import { useStore } from "@/lib/store";
import { isAzureEnabled, runAzurePronunciation, type AzurePronResult } from "@/lib/azure-pron";
import type { Grade } from "@/types";
import { cn } from "@/lib/utils";
import { logActivity } from "@/lib/activity-client";

type UnifiedResult =
  | ({ engine: "web-speech" } & PronunciationResult)
  | ({ engine: "azure" } & AzurePronResult);

type Phrase = {
  id: string;
  kind: "word" | "sentence" | "dialogue-line";
  text: string;
  translation?: string;
  sourceLabel: string;
};

const CATEGORIES: { id: Phrase["kind"]; label: string }[] = [
  { id: "word", label: "Слова" },
  { id: "sentence", label: "Предложения" },
  { id: "dialogue-line", label: "Диалоги" },
];

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);
}

function buildPhrases(grade: Grade): Phrase[] {
  const out: Phrase[] = [];
  for (const v of vocabularyByGrade(grade)) {
    out.push({
      id: `w-${v.id}`,
      kind: "word",
      text: v.example,
      translation: `${v.word} — ${v.translation}`,
      sourceLabel: `Пример со словом «${v.word}»`,
    });
  }
  for (const r of READINGS.filter((x) => x.grade === grade)) {
    const sentences = splitSentences(r.text).slice(0, 4);
    sentences.forEach((s, i) => {
      out.push({
        id: `s-${r.id}-${i}`,
        kind: "sentence",
        text: s,
        sourceLabel: `Текст «${r.title}»`,
      });
    });
  }
  for (const d of DIALOGUES.filter((x) => x.grade === grade)) {
    d.lines.slice(0, 6).forEach((l, i) => {
      out.push({
        id: `d-${d.id}-${i}`,
        kind: "dialogue-line",
        text: l.text,
        sourceLabel: `Диалог «${d.title}» — ${l.speaker === "A" ? d.speakerA : d.speakerB}`,
      });
    });
  }
  return out;
}

export default function PronunciationPage() {
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [azure, setAzure] = useState<boolean | null>(null);
  const [cat, setCat] = useState<Phrase["kind"]>("word");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sr = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    setSupported(Boolean(sr));
    void isAzureEnabled().then(setAzure);
  }, []);

  const phrases = useMemo(() => (student ? buildPhrases(student.grade) : []), [student]);
  const filtered = useMemo(() => phrases.filter((p) => p.kind === cat), [phrases, cat]);

  if (!student) return null;
  if (!phrases.length) return <EmptyState title="Нет фраз для тренировки" />;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Лингафонный кабинет</h1>
          <p className="text-sm text-muted-foreground">
            Слушай образец, повторяй вслух — получай оценку по звёздам
            {azure ? " и покадровый скоринг фонем от Azure." : "."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {azure ? (
            <Badge variant="primary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Azure
            </Badge>
          ) : null}
          <Badge variant="outline">{student.grade} класс</Badge>
        </div>
      </div>

      {supported === false && !azure ? (
        <Card>
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-warning" />
            <div>
              Распознавание речи через Web Speech работает только в Chrome и Edge. Прослушивание
              TTS — везде. Включи Azure (поставь ключ в env), чтобы получить пофонемный скоринг
              в любом современном браузере.
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              cat === c.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
            <span className="ml-2 text-xs opacity-70">
              {phrases.filter((p) => p.kind === c.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map((p) => (
          <PhraseCard
            key={p.id}
            phrase={p}
            supported={Boolean(supported)}
            azureEnabled={Boolean(azure)}
            isActive={activeId === p.id}
            onActivate={(yes) => setActiveId(yes ? p.id : null)}
            onResult={(phrase, r) => {
              const categoryMap: Record<Phrase["kind"], "word" | "sentence" | "dialogue"> = {
                word: "word",
                sentence: "sentence",
                "dialogue-line": "dialogue",
              };
              const shape = normalizeForDb(r);
              void fetch("/api/pronunciation", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  studentId: student.id,
                  grade: student.grade,
                  category: categoryMap[phrase.kind],
                  expected: phrase.text,
                  transcript: shape.transcript,
                  score: shape.score,
                  stars: shape.stars,
                  missedWords: shape.missedWords,
                  engine: r.engine,
                  azure: r.engine === "azure"
                    ? {
                        accuracy: r.accuracy,
                        fluency: r.fluency,
                        completeness: r.completeness,
                        pronScore: r.pronScore,
                        words: r.words,
                      }
                    : null,
                }),
              }).catch(() => {/* silent */});
              const xp = Math.max(1, Math.round(shape.stars * 2));
              void logActivity({
                studentId: student.id,
                activityType: "pronunciation",
                xp,
                correct: shape.stars >= 3 ? 1 : 0,
                total: 1,
                skill: "speaking",
                meta: { expected: phrase.text, stars: shape.stars, engine: r.engine },
              }).then((res) => {
                if (res) updateStudent({ xp: res.xp, level: res.level, streak: res.streak });
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function normalizeForDb(r: UnifiedResult): {
  transcript: string;
  score: number;
  stars: 0 | 1 | 2 | 3 | 4 | 5;
  missedWords: string[];
} {
  if (r.engine === "azure") {
    const score = Math.max(0, Math.min(1, r.accuracy / 100));
    const stars = starsFromScore(score);
    const missed = r.words
      .filter((w) => w.errorType !== "None" || w.accuracyScore < 60)
      .map((w) => w.word);
    return { transcript: r.transcript, score, stars, missedWords: missed };
  }
  return {
    transcript: r.transcript,
    score: r.score,
    stars: r.stars,
    missedWords: r.words.filter((w) => !w.ok).map((w) => w.word),
  };
}

function starsFromScore(score: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (score >= 0.9) return 5;
  if (score >= 0.75) return 4;
  if (score >= 0.6) return 3;
  if (score >= 0.4) return 2;
  if (score >= 0.2) return 1;
  return 0;
}

function PhraseCard({
  phrase,
  supported,
  azureEnabled,
  isActive,
  onActivate,
  onResult,
}: {
  phrase: Phrase;
  supported: boolean;
  azureEnabled: boolean;
  isActive: boolean;
  onActivate: (active: boolean) => void;
  onResult?: (phrase: Phrase, result: UnifiedResult) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UnifiedResult | null>(null);
  const recRef = useRef<unknown | null>(null);

  const speak = (rate = 0.95) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(phrase.text);
    u.lang = "en-US";
    u.rate = rate;
    window.speechSynthesis.speak(u);
  };

  const startAzure = async () => {
    setBusy(true);
    setRecording(true);
    onActivate(true);
    try {
      const res = await runAzurePronunciation(phrase.text);
      if (res.enabled) {
        const unified: UnifiedResult = { engine: "azure", ...res };
        setResult(unified);
        onResult?.(phrase, unified);
      } else {
        // Azure failed mid-flight — fall back to legacy path next click.
        console.warn("Azure pronunciation failed:", res.error);
      }
    } finally {
      setBusy(false);
      setRecording(false);
    }
  };

  const startWebSpeech = () => {
    const SR: unknown =
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) return;
    type SRInstance = {
      lang: string;
      interimResults: boolean;
      continuous?: boolean;
      start: () => void;
      stop: () => void;
      abort: () => void;
      onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void;
      onerror: (e: unknown) => void;
    };
    const Ctor = SR as new () => SRInstance;
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (ev) => {
      const first = ev.results[0];
      const transcript = first?.[0]?.transcript ?? "";
      const r = scorePronunciation(phrase.text, transcript);
      const unified: UnifiedResult = { engine: "web-speech", ...r };
      setResult(unified);
      onResult?.(phrase, unified);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
    setRecording(true);
    onActivate(true);
  };

  const startRec = () => {
    if (azureEnabled) void startAzure();
    else startWebSpeech();
  };

  const stopRec = () => {
    const rec = recRef.current as { stop?: () => void; abort?: () => void } | null;
    try { rec?.stop?.(); } catch { /* noop */ }
    setRecording(false);
  };

  return (
    <Card className={isActive ? "border-primary" : undefined}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {phrase.sourceLabel}
            </div>
            <div className="mt-1 text-lg font-medium leading-snug">{phrase.text}</div>
            {phrase.translation ? (
              <div className="mt-0.5 text-sm text-muted-foreground">{phrase.translation}</div>
            ) : null}
          </div>
          <div className="flex flex-none items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => speak(0.8)} className="gap-2">
              <Volume2 className="h-4 w-4" /> Медленно
            </Button>
            <Button variant="outline" size="sm" onClick={() => speak(1)} className="gap-2">
              <Volume2 className="h-4 w-4" /> Обычно
            </Button>
            {recording || busy ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopRec}
                disabled={busy}
                className="gap-2"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MicOff className="h-4 w-4" />}
                {busy ? "Анализ…" : "Стоп"}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={startRec}
                disabled={!azureEnabled && !supported}
                className="gap-2"
                title={azureEnabled ? "Azure — пофонемный скоринг" : supported ? undefined : "Нужен Chrome или Edge"}
              >
                <Mic className="h-4 w-4" /> Повторить вслух
              </Button>
            )}
          </div>
        </div>

        {result ? <ResultPanel result={result} /> : null}
      </CardContent>
    </Card>
  );
}

function ResultPanel({ result }: { result: UnifiedResult }) {
  const scorePct =
    result.engine === "azure" ? Math.round(result.accuracy) : Math.round(result.score * 100);
  const stars = result.engine === "azure" ? starsFromScore(result.accuracy / 100) : result.stars;
  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-sm">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i <= stars ? "fill-warning text-warning" : "text-muted-foreground"
              }`}
            />
          ))}
          <span className="ml-2 text-muted-foreground">{scorePct}% точности</span>
          {result.engine === "azure" ? (
            <Badge variant="primary" className="ml-2 gap-1">
              <Sparkles className="h-3 w-3" /> Azure
            </Badge>
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground">
          Вы сказали: «{result.transcript || "—"}»
        </div>
      </div>

      {result.engine === "azure" ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <Metric label="Accuracy" value={result.accuracy} />
          <Metric label="Fluency" value={result.fluency} />
          <Metric label="Completeness" value={result.completeness} />
          <Metric label="Pron. score" value={result.pronScore} />
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5 text-sm">
        {result.engine === "azure"
          ? result.words.map((w, i) => (
              <span
                key={i}
                className={cn(
                  "rounded px-1.5 py-0.5",
                  w.errorType === "None" && w.accuracyScore >= 75 && "bg-success/15 text-success",
                  w.errorType === "None" && w.accuracyScore < 75 && w.accuracyScore >= 50 && "bg-warning/15 text-warning",
                  (w.errorType !== "None" || w.accuracyScore < 50) && "bg-destructive/15 text-destructive",
                  w.errorType === "Omission" && "line-through",
                )}
                title={`${w.errorType} · ${Math.round(w.accuracyScore)}%`}
              >
                {w.word}
              </span>
            ))
          : result.words.map((w, i) => (
              <span
                key={i}
                className={`rounded px-1.5 py-0.5 ${
                  w.ok
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive line-through"
                }`}
              >
                {w.word}
              </span>
            ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const v = Math.round(value);
  const tone = v >= 75 ? "text-success" : v >= 50 ? "text-warning" : "text-destructive";
  return (
    <div className="rounded border border-border bg-surface px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("text-lg font-semibold tabular-nums", tone)}>{v}</div>
    </div>
  );
}
