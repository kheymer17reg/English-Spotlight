"use client";

import { useMemo, useRef, useState } from "react";
import { BookOpen, ChevronDown, Pause, Play, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { useStore } from "@/lib/store";
import { DIALOGUES } from "@/lib/dialogues";
import type { Dialogue } from "@/types";
import { logActivity } from "@/lib/activity-client";

export default function DialoguesPage() {
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const items: Dialogue[] = useMemo(() => {
    if (!student) return [];
    return [
      ...DIALOGUES.filter((d) => d.grade === student.grade),
      ...DIALOGUES.filter((d) => d.grade !== student.grade),
    ];
  }, [student]);
  const [active, setActive] = useState<Dialogue | null>(items[0] ?? null);

  if (!student) return null;
  if (!items.length) return <EmptyState title="Диалогов пока нет" />;

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-2">
        {items.map((d) => (
          <button
            key={d.id}
            onClick={() => setActive(d)}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              active?.id === d.id
                ? "border-primary bg-primary/5"
                : "border-border bg-surface hover:bg-muted"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{d.title}</span>
              <Badge variant="outline" className="text-[10px]">{d.level}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {d.grade} класс · модуль {d.module} · {d.speakerA} & {d.speakerB}
            </div>
          </button>
        ))}
      </aside>
      {active ? (
        <DialogueView
          d={active}
          onActivity={(kind) => {
            void logActivity({
              studentId: student.id,
              activityType: "listening",
              xp: kind === "listen" ? 4 : 3,
              skill: "listening",
              moduleNumber: active.module,
              meta: { dialogueId: active.id, kind },
            }).then((r) => {
              if (r) updateStudent({ xp: r.xp, level: r.level, streak: r.streak });
            });
          }}
        />
      ) : null}
    </div>
  );
}

function DialogueView({ d, onActivity }: { d: Dialogue; onActivity: (kind: "listen" | "reveal") => void }) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});
  const [playing, setPlaying] = useState(false);
  const [playingLine, setPlayingLine] = useState<number | null>(null);
  const cancelRef = useRef(false);

  const speakLine = (text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    u.onend = () => onEnd?.();
    window.speechSynthesis.speak(u);
  };

  const playAll = async () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    cancelRef.current = false;
    setPlaying(true);
    onActivity("listen");
    for (let i = 0; i < d.lines.length; i++) {
      if (cancelRef.current) break;
      setPlayingLine(i);
      await new Promise<void>((resolve) => speakLine(d.lines[i].text, resolve));
      await new Promise((r) => setTimeout(r, 250));
    }
    setPlaying(false);
    setPlayingLine(null);
  };

  const stop = () => {
    cancelRef.current = true;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setPlayingLine(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="primary" className="mb-2">
              {d.level} · {d.grade} класс · модуль {d.module}
            </Badge>
            <CardTitle>{d.title}</CardTitle>
            <CardDescription>{d.summary}</CardDescription>
          </div>
          {playing ? (
            <Button variant="outline" size="sm" onClick={stop} className="gap-2">
              <Pause className="h-4 w-4" /> Стоп
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={playAll} className="gap-2">
              <Play className="h-4 w-4" /> Слушать диалог
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {d.lines.map((l, i) => {
            const isA = l.speaker === "A";
            const name = isA ? d.speakerA : d.speakerB;
            const isPlayingNow = playingLine === i;
            return (
              <div key={i} className={`flex items-start gap-3 ${isA ? "" : "flex-row-reverse"}`}>
                <div
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-semibold ${
                    isA
                      ? "bg-primary/15 text-primary"
                      : "bg-accent/20 text-accent-foreground"
                  }`}
                  aria-hidden
                >
                  {name.slice(0, 1)}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl border px-4 py-2.5 text-sm ${
                    isA
                      ? "rounded-tl-sm border-primary/25 bg-primary/5"
                      : "rounded-tr-sm border-border bg-muted/40"
                  } ${isPlayingNow ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="mb-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                    {name}
                  </div>
                  <div className="leading-relaxed">{l.text}</div>
                  <button
                    type="button"
                    aria-label="Озвучить"
                    onClick={() => speakLine(l.text)}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <Volume2 className="h-3 w-3" /> слушать
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setGlossaryOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Глоссарий ({d.glossary.length})
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${glossaryOpen ? "rotate-180" : ""}`} />
          </button>
          {glossaryOpen ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {d.glossary.map((g) => (
                <div
                  key={g.word}
                  className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="font-medium">{g.word}</div>
                  <div className="text-muted-foreground">{g.translation}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {d.questions.length ? (
          <div>
            <div className="mb-2 text-sm font-medium">Вопросы на понимание</div>
            <div className="space-y-2">
              {d.questions.map((q, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface p-3">
                  <div className="text-sm">
                    <strong>{i + 1}.</strong> {q.q}
                  </div>
                  {showAnswer[q.q] ? (
                    <div className="mt-1 text-sm text-success">→ {q.a}</div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAnswer((s) => ({ ...s, [q.q]: true }));
                        onActivity("reveal");
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
        ) : null}
      </CardContent>
    </Card>
  );
}
