"use client";

import { useMemo, useState } from "react";
import { Volume2, BookOpen, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { useStore } from "@/lib/store";
import { READINGS } from "@/lib/readings";
import type { ReadingText } from "@/types";
import { logActivity } from "@/lib/activity-client";

export default function ReadingPage() {
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const texts: ReadingText[] = useMemo(() => {
    if (!student) return [];
    return [
      ...READINGS.filter((r) => r.grade === student.grade),
      ...READINGS.filter((r) => r.grade !== student.grade),
    ];
  }, [student]);
  const [active, setActive] = useState<ReadingText | null>(texts[0] ?? null);

  if (!student) return null;
  if (!texts.length) return <EmptyState title="Текстов пока нет" />;

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-2">
        {texts.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t)}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              active?.id === t.id
                ? "border-primary bg-primary/5"
                : "border-border bg-surface hover:bg-muted"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{t.title}</span>
              <Badge variant="outline" className="text-[10px]">{t.level}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{t.grade} класс</div>
          </button>
        ))}
      </aside>
      {active ? (
        <ReadingView
          t={active}
          onRevealAnswer={() => {
            void logActivity({
              studentId: student.id,
              activityType: "reading",
              xp: 3,
              skill: "reading",
              meta: { readingId: active.id },
            }).then((r) => {
              if (r) updateStudent({ xp: r.xp, level: r.level, streak: r.streak });
            });
          }}
        />
      ) : null}
    </div>
  );
}

function ReadingView({ t, onRevealAnswer }: { t: ReadingText; onRevealAnswer: () => void }) {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState<Record<string, boolean>>({});
  const speak = (s: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(s);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="primary" className="mb-2">{t.level} · {t.grade} класс</Badge>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>С глоссарием и вопросами на понимание</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => speak(t.text)} className="gap-2">
            <Volume2 className="h-4 w-4" /> Прослушать
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <InteractiveText text={t.text} glossary={t.glossary} speak={speak} />
        <p className="-mt-3 text-[11px] text-muted-foreground">
          Подсказка: нажми на слово, чтобы услышать его. Подчёркнутые слова из глоссария — с переводом.
        </p>

        <div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium"
          >
            <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Глоссарий ({t.glossary.length})</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {t.glossary.map((g) => (
                <div key={g.word} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <div className="font-medium">{g.word}</div>
                  <div className="text-muted-foreground">{g.translation}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">Вопросы на понимание</div>
          <div className="space-y-2">
            {t.questions.map((q, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface p-3">
                <div className="text-sm"><strong>{i + 1}.</strong> {q.q}</div>
                {show[q.q] ? (
                  <div className="mt-1 text-sm text-success">→ {q.a}</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShow((s) => ({ ...s, [q.q]: true }));
                      onRevealAnswer();
                    }}
                    className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Показать ответ
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InteractiveText({
  text,
  glossary,
  speak,
}: {
  text: string;
  glossary: { word: string; translation: string }[];
  speak: (s: string) => void;
}) {
  const dict = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of glossary) {
      const key = g.word.toLowerCase().split(/\s+/)[0];
      if (key && !m.has(key)) m.set(key, g.translation);
    }
    return m;
  }, [glossary]);

  return (
    <div className="whitespace-pre-wrap rounded-xl bg-muted/40 p-5 text-[15px] leading-relaxed">
      {text.split(/(\s+)/).map((chunk, i) => {
        if (/^\s+$/.test(chunk)) return <span key={i}>{chunk}</span>;
        const bare = chunk.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
        const translation = bare ? dict.get(bare) : undefined;
        return (
          <Word
            key={i}
            raw={chunk}
            translation={translation}
            onSpeak={() => speak(chunk.replace(/[^\p{L}\p{N}\p{M}'-]+/gu, ""))}
          />
        );
      })}
    </div>
  );
}

function Word({
  raw,
  translation,
  onSpeak,
}: {
  raw: string;
  translation?: string;
  onSpeak: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasTranslation = Boolean(translation);
  return (
    <span
      onMouseEnter={() => hasTranslation && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => {
        onSpeak();
        if (hasTranslation) setOpen((o) => !o);
      }}
      className={`relative inline-block cursor-pointer rounded px-[1px] transition-colors hover:bg-primary/10 ${
        hasTranslation ? "border-b border-dashed border-primary/60 font-medium text-primary" : ""
      }`}
    >
      {raw}
      {open && hasTranslation ? (
        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-[12px] font-normal text-foreground shadow-lg">
          {translation}
        </span>
      ) : null}
    </span>
  );
}
