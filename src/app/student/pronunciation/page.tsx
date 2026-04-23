"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Mic, MicOff, Star, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { DIALOGUES } from "@/lib/dialogues";
import { READINGS } from "@/lib/readings";
import { vocabularyByGrade } from "@/lib/vocabulary";
import { scorePronunciation, type PronunciationResult } from "@/lib/pronunciation";
import { useStore } from "@/lib/store";
import type { Grade } from "@/types";

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
  const [supported, setSupported] = useState<boolean | null>(null);
  const [cat, setCat] = useState<Phrase["kind"]>("word");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sr = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    setSupported(Boolean(sr));
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
            Слушай образец, повторяй вслух — получай оценку по звёздам.
          </p>
        </div>
        <Badge variant="outline">{student.grade} класс</Badge>
      </div>

      {supported === false ? (
        <Card>
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-warning" />
            <div>
              Распознавание речи работает только в Chrome и Edge (настольные). Все остальные функции
              (прослушивание TTS) доступны везде — проигрывание работает и в Firefox/Safari.
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
            isActive={activeId === p.id}
            onActivate={(yes) => setActiveId(yes ? p.id : null)}
          />
        ))}
      </div>
    </div>
  );
}

function PhraseCard({
  phrase,
  supported,
  isActive,
  onActivate,
}: {
  phrase: Phrase;
  supported: boolean;
  isActive: boolean;
  onActivate: (active: boolean) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const recRef = useRef<unknown | null>(null);

  const speak = (rate = 0.95) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(phrase.text);
    u.lang = "en-US";
    u.rate = rate;
    window.speechSynthesis.speak(u);
  };

  const startRec = () => {
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
      setResult(scorePronunciation(phrase.text, transcript));
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
    setRecording(true);
    onActivate(true);
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
            {recording ? (
              <Button variant="destructive" size="sm" onClick={stopRec} className="gap-2">
                <MicOff className="h-4 w-4" /> Стоп
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={startRec}
                disabled={!supported}
                className="gap-2"
                title={supported ? undefined : "Нужен Chrome или Edge"}
              >
                <Mic className="h-4 w-4" /> Повторить вслух
              </Button>
            )}
          </div>
        </div>

        {result ? (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-sm">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i <= result.stars ? "fill-warning text-warning" : "text-muted-foreground"
                    }`}
                  />
                ))}
                <span className="ml-2 text-muted-foreground">
                  {Math.round(result.score * 100)}% точности
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Вы сказали: «{result.transcript || "—"}»
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-sm">
              {result.words.map((w, i) => (
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
        ) : null}
      </CardContent>
    </Card>
  );
}
