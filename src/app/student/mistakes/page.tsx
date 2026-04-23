"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles, Target, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { useStore } from "@/lib/store";
import type { MistakeRecord } from "@/types";

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

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">Мои ошибки</h1>
        <p className="text-muted-foreground">
          Карточки из твоих неверных ответов. 3 правильных подряд — и слово/правило переходит в «усвоенные».
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Нужно повторить" value={stats.dueNow} tone="warning" />
        <StatTile label="В работе" value={stats.active} tone="accent" />
        <StatTile label="Освоено" value={stats.mastered} tone="success" />
      </div>

      {loading ? (
        <Card>
          <CardContent className="grid place-items-center p-8">
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
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Карточка {idx + 1} / {due.length}</CardTitle>
                <CardDescription>
                  <span className="capitalize">{kindLabel(current.kind)}</span> · из {sourceLabel(current.source)}
                </CardDescription>
              </div>
              <Badge variant="primary" className="gap-1">
                <Target className="h-3 w-3" /> +5 XP за верный ответ
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Вопрос</div>
              <div className="mt-1 text-lg font-medium">{current.question}</div>
              {current.studentAnswer ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  Твой прошлый ответ: <span className="line-through">{current.studentAnswer}</span>
                </div>
              ) : null}
            </div>
            {revealed ? (
              <div
                className={
                  "rounded-xl border p-5 " +
                  (feedback === "correct"
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : feedback === "wrong"
                      ? "border-rose-500/40 bg-rose-500/5"
                      : "border-border bg-surface")
                }
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Правильный ответ</div>
                <div className="mt-1 text-lg font-semibold">{current.correctAnswer}</div>
                <div className="mt-3 text-sm text-muted-foreground">
                  Повторяли: {current.timesSeen} раз · правильно: {current.timesCorrect} / 3
                </div>
              </div>
            ) : null}

            {!revealed ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setRevealed(true)} className="gap-2">
                  Показать ответ
                </Button>
              </div>
            ) : feedback ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={next} className="gap-2" variant="outline" disabled={busy}>
                  Дальше
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => submit(true)}
                  className="gap-2"
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
      ? "border-amber-500/30 bg-amber-500/5"
      : tone === "success"
        ? "border-emerald-500/30 bg-emerald-500/5"
        : "border-accent/30 bg-accent/5";
  return (
    <div className={"rounded-xl border p-4 " + toneClass}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-display font-semibold">{value}</div>
    </div>
  );
}
