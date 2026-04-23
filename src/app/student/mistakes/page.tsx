"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles, Target, X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { useStore } from "@/lib/store";
import type { MistakeRecord } from "@/types";
import { cn } from "@/lib/utils";

interface ApiResponse {
  mistakes: MistakeRecord[];
  stats: { active: number; mastered: number; dueNow: number };
}

export default function MistakesPage() {
  const router = useRouter();
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);

  useEffect(() => {
    if (student === null) router.replace("/");
  }, [student, router]);

  const load = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/student/mistakes?studentId=${student.id}&due=1`);
      const json = (await res.json()) as ApiResponse;
      setData(json);
      setIdx(0);
      setRevealed(false);
      setFeedback(null);
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!student) return null;

  const due = data?.mistakes ?? [];
  const current = due[idx] ?? null;
  const stats = data?.stats ?? { active: 0, mastered: 0, dueNow: 0 };

  const submit = async (wasCorrect: boolean) => {
    if (!current || busy) return;
    setBusy(true);
    setFeedback(wasCorrect ? "correct" : "wrong");
    try {
      const res = await fetch(`/api/student/mistakes/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, wasCorrect }),
      });
      if (res.ok) {
        const json = (await res.json()) as { xp: number; level: number; streak: number };
        updateStudent({ xp: json.xp, level: json.level, streak: json.streak });
      }
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    setFeedback(null);
    setRevealed(false);
    if (idx + 1 < due.length) setIdx(idx + 1);
    else void load();
  };

  const progress = due.length > 0 ? Math.round(((idx + (feedback ? 1 : 0)) / due.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Мои ошибки</h1>
        <p className="text-muted-foreground">
          Карточки из твоих неверных ответов. 3 правильных подряд — и слово переходит в «усвоенные».
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="На повторение" value={stats.dueNow} tone="warning" />
        <StatTile label="В работе" value={stats.active} tone="accent" />
        <StatTile label="Освоено" value={stats.mastered} tone="success" />
      </div>

      {loading ? (
        <Card>
          <CardContent className="grid place-items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !current ? (
        <EmptyState
          icon={Sparkles}
          title={stats.active === 0 ? "Пока никаких ошибок — ты молодец!" : "На сегодня всё повторено"}
          description={
            stats.active === 0
              ? "Сделай упражнение или квиз — неправильные ответы появятся здесь для повторения."
              : `Вернись завтра: ${stats.active} карточек в работе, но сейчас ничего не требует повторения.`
          }
        />
      ) : (
        <Card
          className={cn(
            "overflow-hidden transition-colors",
            feedback === "correct"
              ? "border-emerald-500/40 bg-emerald-500/5"
              : feedback === "wrong"
                ? "border-rose-500/40 bg-rose-500/5"
                : "border-primary/15 bg-gradient-to-br from-primary/5 via-surface to-accent/5",
          )}
        >
          <div className="h-1 w-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="font-display text-xl">
                  Карточка {idx + 1} / {due.length}
                </CardTitle>
                <CardDescription>
                  <span className="capitalize">{kindLabel(current.kind)}</span> · из {sourceLabel(current.source)}
                </CardDescription>
              </div>
              <Badge variant="primary" className="gap-1">
                <Zap className="h-3 w-3" /> +5 XP за верный
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pb-6">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Вопрос
              </div>
              <div className="mt-1.5 font-display text-2xl font-semibold leading-snug">
                {current.question}
              </div>
              {current.studentAnswer ? (
                <div className="mt-3 text-xs text-muted-foreground">
                  Прошлый ответ:{" "}
                  <span className="font-medium text-rose-500 line-through">
                    {current.studentAnswer}
                  </span>
                </div>
              ) : null}
            </div>

            {revealed ? (
              <div
                className={cn(
                  "rounded-2xl border p-5 transition-all",
                  feedback === "correct"
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : feedback === "wrong"
                      ? "border-rose-500/50 bg-rose-500/10"
                      : "border-primary/30 bg-primary/5",
                )}
              >
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Правильный ответ
                </div>
                <div className="mt-1 font-display text-xl font-semibold">
                  {current.correctAnswer}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 w-8 rounded-full",
                          i < current.timesCorrect ? "bg-emerald-500" : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                  <span>
                    правильно {current.timesCorrect} / 3 · показано {current.timesSeen}
                  </span>
                </div>
              </div>
            ) : null}

            {!revealed ? (
              <Button onClick={() => setRevealed(true)} className="w-full gap-2 sm:w-auto">
                Показать ответ
              </Button>
            ) : feedback ? (
              <Button
                onClick={next}
                className="w-full gap-2 sm:w-auto"
                disabled={busy}
              >
                Дальше
              </Button>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  onClick={() => submit(true)}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95"
                  disabled={busy}
                >
                  <Check className="h-4 w-4" /> Я знал / угадал
                </Button>
                <Button
                  onClick={() => submit(false)}
                  className="gap-2"
                  variant="outline"
                  disabled={busy}
                >
                  <X className="h-4 w-4" /> Не знал
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function kindLabel(k: MistakeRecord["kind"]): string {
  switch (k) {
    case "vocab":
      return "Лексика";
    case "grammar":
      return "Грамматика";
    case "listening":
      return "Аудирование";
    case "translation":
      return "Перевод";
    case "reading":
      return "Чтение";
  }
}

function sourceLabel(s: MistakeRecord["source"]): string {
  switch (s) {
    case "exercise":
      return "упражнения";
    case "vocab_drill":
      return "словарной тренировки";
    case "homework":
      return "домашнего задания";
    case "test":
      return "контрольной";
    case "dialogue":
      return "диалога";
  }
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "success" | "accent";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 text-amber-700 dark:text-amber-300"
      : tone === "success"
        ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 text-emerald-700 dark:text-emerald-300"
        : "border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 text-violet-700 dark:text-violet-300";
  const Icon = tone === "warning" ? Target : tone === "success" ? Sparkles : Zap;
  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-80">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
