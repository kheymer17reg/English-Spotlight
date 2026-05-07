"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, GraduationCap, Lightbulb, Loader2, PartyPopper, RefreshCw, Wand2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty";
import { useStore } from "@/lib/store";
import { modulesByGrade } from "@/lib/curriculum";
import type { ExerciseItem, ExerciseType, GeneratedExercise, MistakeKind } from "@/types";
import { cn } from "@/lib/utils";
import { computeExerciseXp, logActivity } from "@/lib/activity-client";

const TYPE_LABELS: Record<ExerciseType, string> = {
  multiple_choice: "Тест (4 варианта)",
  fill_blank: "Заполни пропуски",
  match_pairs: "Соедини пары",
  open_ended: "Открытый вопрос",
  true_false: "Верно / неверно",
};

function exerciseKindToMistakeKind(type: ExerciseType): MistakeKind {
  if (type === "match_pairs" || type === "open_ended") return "vocab";
  if (type === "fill_blank" || type === "true_false") return "grammar";
  return "grammar";
}

export default function PracticePage() {
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const modules = useMemo(() => (student ? modulesByGrade(student.grade) : []), [student]);
  const [moduleNum, setModuleNum] = useState(student?.currentModule ?? 1);
  const [type, setType] = useState<ExerciseType>("multiple_choice");
  const [ex, setEx] = useState<GeneratedExercise | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const answeredCount = ex ? ex.items.filter((it) => answers[it.id] != null && answers[it.id] !== "").length : 0;
  const totalCount = ex ? ex.items.length : 0;
  const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const allAnswered = totalCount > 0 && answeredCount === totalCount;

  const generate = async () => {
    if (!student) return;
    setBusy(true);
    setError(null);
    setEx(null);
    setAnswers({});
    setSubmitted(false);
    setRevealed({});
    try {
      const res = await fetch("/api/ai/generate-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: student.grade,
          module: moduleNum,
          type,
          difficulty: "medium",
          count: 6,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось сгенерировать упражнение");
      } else {
        setEx(data.exercise);
      }
    } catch {
      setError("Сбой сети");
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    setSubmitted(true);
    if (!ex || !student) return;
    const correct = ex.items.reduce((acc, it) => acc + (isCorrect(it, answers[it.id]) ? 1 : 0), 0);
    const total = ex.items.length;
    const mistakeKind = exerciseKindToMistakeKind(ex.type);
    const mistakes = ex.items
      .filter((it) => !isCorrect(it, answers[it.id]))
      .map((it) => ({
        kind: mistakeKind,
        source: "exercise" as const,
        question: it.prompt,
        correctAnswer: expectedString(it),
        studentAnswer: answers[it.id] ?? "",
        moduleNumber: ex.module,
        grade: student.grade,
      }));
    const result = await logActivity({
      studentId: student.id,
      activityType: "exercise",
      xp: computeExerciseXp(correct, total),
      correct,
      total,
      skill: mistakeKind === "vocab" ? "vocabulary" : "grammar",
      moduleNumber: ex.module,
      mistakes,
      meta: { type: ex.type, difficulty: ex.difficulty },
    });
    if (result) {
      updateStudent({ xp: result.xp, level: result.level, streak: result.streak });
    }
  };

  const reveal = (id: string) => setRevealed((r) => ({ ...r, [id]: true }));

  // Enter from anywhere outside an input fires "Check" once all answers are given.
  // Use a ref to avoid re-binding the listener every render.
  const checkRef = useRef(check);
  checkRef.current = check;
  useEffect(() => {
    if (!ex || submitted) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "Enter" && allAnswered) {
        e.preventDefault();
        checkRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ex, submitted, allAnswered]);

  if (!student) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-32">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold">Тренировка</h1>
          <p className="text-muted-foreground">
            Lumos сгенерирует упражнения по текущему модулю — проверяй себя и лови XP.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Подсказка: жми <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">1</kbd>–<kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">4</kbd> для вариантов, <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">Enter</kbd> чтобы проверить.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Модуль</label>
            <Select value={String(moduleNum)} onChange={(e) => setModuleNum(Number(e.target.value))}>
              {modules.map((m) => (
                <option key={m.id} value={m.number}>
                  Модуль {m.number} · {m.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Тип упражнения</label>
            <Select value={type} onChange={(e) => setType(e.target.value as ExerciseType)}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <Button onClick={generate} disabled={busy} className="h-10 self-end gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Сгенерировать
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {!ex && !busy && !error ? (
        <EmptyState
          icon={Wand2}
          title="Ещё нет упражнения"
          description="Выбери модуль и тип, и Lumos сгенерирует задания по программе Spotlight."
        />
      ) : null}

      {ex && !submitted ? (
        <div className="sticky top-2 z-20 -mt-2 mb-2">
          <div className="rounded-2xl border border-border bg-background/85 px-4 py-2.5 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-muted-foreground">
                {answeredCount} / {totalCount}
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    progressPct >= 100
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-gradient-to-r from-primary to-accent",
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <Button
                size="sm"
                onClick={check}
                disabled={!allAnswered}
                className="gap-2"
                title={allAnswered ? "Проверить ответы" : "Сначала ответь на все вопросы"}
              >
                Проверить <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {ex ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>{ex.title}</CardTitle>
                <CardDescription>
                  {student.grade} класс · Модуль {ex.module} · {TYPE_LABELS[ex.type]}
                </CardDescription>
              </div>
              <Badge variant="primary">{ex.items.length} заданий</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {ex.items.map((it, idx) => (
              <ExerciseRow
                key={it.id}
                index={idx + 1}
                item={it}
                value={answers[it.id]}
                revealed={!!revealed[it.id] || submitted}
                submitted={submitted}
                onChange={(v) => setAnswers((a) => ({ ...a, [it.id]: v }))}
                onReveal={() => reveal(it.id)}
              />
            ))}
            {submitted ? (() => {
              const correct = ex.items.filter((it) => isCorrect(it, answers[it.id])).length;
              const total = ex.items.length;
              const pct = Math.round((correct / total) * 100);
              const tone =
                pct >= 80
                  ? "emerald"
                  : pct >= 50
                    ? "amber"
                    : "rose";
              const toneCls =
                tone === "emerald"
                  ? "border-emerald-500/40 from-emerald-500/15 via-teal-500/10 to-primary/5"
                  : tone === "amber"
                    ? "border-amber-500/40 from-amber-500/15 via-orange-500/10 to-primary/5"
                    : "border-rose-500/40 from-rose-500/15 via-pink-500/10 to-primary/5";
              const iconCls =
                tone === "emerald"
                  ? "from-emerald-500 to-teal-500"
                  : tone === "amber"
                    ? "from-amber-500 to-orange-500"
                    : "from-rose-500 to-pink-500";
              return (
                <div
                  className={cn(
                    "rounded-2xl border bg-gradient-to-r p-4",
                    toneCls,
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br text-white",
                          iconCls,
                        )}
                      >
                        <PartyPopper className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-display text-lg font-semibold">
                          {correct} / {total} — {pct}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pct >= 80
                            ? "Отлично! Берём следующее?"
                            : pct >= 50
                              ? "Неплохо, ошибки ушли в «Мои ошибки»."
                              : "Повтори тему и попробуй ещё."}
                        </div>
                      </div>
                    </div>
                    <Button onClick={generate} className="gap-2">
                      <RefreshCw className="h-4 w-4" /> Новое упражнение
                    </Button>
                  </div>
                </div>
              );
            })() : (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <Button variant="ghost" onClick={generate} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Новое упражнение
                </Button>
                <Button onClick={check} className="gap-2">
                  Проверить <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ExerciseRow({
  index,
  item,
  value,
  revealed,
  submitted,
  onChange,
  onReveal,
}: {
  index: number;
  item: ExerciseItem;
  value: string | undefined;
  revealed: boolean;
  submitted: boolean;
  onChange: (v: string) => void;
  onReveal: () => void;
}) {
  const correct = isCorrect(item, value);
  const showFeedback = revealed;
  const rowRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [shake, setShake] = useState(false);

  // Number-key shortcut for multiple_choice / true_false (only first question with no answer yet),
  // and Enter on text input to move on.
  useEffect(() => {
    if (submitted) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (!rowRef.current) return;
      const rect = rowRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.2;
      if (!inView) return;
      if (item.type === "multiple_choice" && item.options) {
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < item.options.length) {
          e.preventDefault();
          onChange(item.options[idx]);
        }
      } else if (item.type === "true_false") {
        if (e.key.toLowerCase() === "t") {
          e.preventDefault();
          onChange("True");
        } else if (e.key.toLowerCase() === "f") {
          e.preventDefault();
          onChange("False");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [item, onChange, submitted]);

  // Trigger a small shake when an answer is revealed wrong.
  useEffect(() => {
    if (revealed && !correct && value) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 450);
      return () => clearTimeout(t);
    }
  }, [revealed, correct, value]);

  return (
    <div
      ref={rowRef}
      className={cn(
        "rounded-xl border bg-muted/30 p-4 transition-colors sm:p-5",
        showFeedback && correct && "border-emerald-500/40 bg-emerald-500/5",
        showFeedback && !correct && value != null && value !== "" && "border-rose-500/40 bg-rose-500/5",
        !showFeedback && "border-border",
        shake && "animate-wiggle",
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className={cn(
            "grid h-9 w-9 flex-none place-items-center rounded-full text-sm font-bold",
            showFeedback && correct
              ? "bg-emerald-500 text-white"
              : showFeedback && value
                ? "bg-rose-500 text-white"
                : "bg-gradient-to-br from-primary to-accent text-white",
          )}
        >
          {showFeedback && correct ? <Check className="h-4 w-4" /> : showFeedback && value ? <X className="h-4 w-4" /> : index}
        </span>
        <div className="text-base font-medium leading-relaxed">{item.prompt}</div>
      </div>

      {item.type === "multiple_choice" && item.options ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {item.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "flex min-h-[52px] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left text-base transition-all hover:bg-muted hover:border-primary/40",
                value === opt && !revealed && "border-primary ring-2 ring-primary/30 bg-primary/5",
                revealed && opt === expectedString(item) && "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                revealed && value === opt && opt !== expectedString(item) && "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300",
              )}
            >
              <kbd className="hidden h-7 w-7 flex-none items-center justify-center rounded-md border border-border bg-muted font-mono text-xs sm:inline-flex">
                {i + 1}
              </kbd>
              <span className="flex-1">{opt}</span>
            </button>
          ))}
        </div>
      ) : item.type === "true_false" ? (
        <div className="flex gap-3">
          {["True", "False"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-base font-medium transition-all hover:bg-muted hover:border-primary/40 sm:flex-none",
                value === opt && !revealed && "border-primary ring-2 ring-primary/30 bg-primary/5",
                revealed && opt === expectedString(item) && "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                revealed && value === opt && opt !== expectedString(item) && "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300",
              )}
            >
              {opt === "True" ? "✔ True" : "✘ False"}
              <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
                {opt[0]}
              </kbd>
            </button>
          ))}
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Твой ответ…"
          className="min-h-[52px] w-full rounded-xl border border-border bg-surface px-4 py-3 text-base shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}

      {!revealed ? (
        <button
          type="button"
          onClick={onReveal}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Lightbulb className="h-3.5 w-3.5" /> Подсказка
        </button>
      ) : null}
      {revealed ? (
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center gap-1.5">
            {correct ? (
              <Badge variant="success" className="gap-1"><Check className="h-3 w-3" /> Верно</Badge>
            ) : (
              <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Ответ: {expectedString(item)}</Badge>
            )}
          </div>
          {item.hint ? <p className="text-xs text-muted-foreground">💡 {item.hint}</p> : null}
          {item.explanation ? <p className="text-xs text-muted-foreground">{item.explanation}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function expectedString(it: ExerciseItem): string {
  if (Array.isArray(it.answer)) return it.answer.join(", ");
  return String(it.answer);
}

function isCorrect(it: ExerciseItem, value: string | undefined): boolean {
  if (value == null) return false;
  const exp = expectedString(it).trim().toLowerCase();
  return value.trim().toLowerCase() === exp;
}
