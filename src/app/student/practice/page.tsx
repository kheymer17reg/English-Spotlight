"use client";

import { useMemo, useState } from "react";
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

  if (!student) return null;

  const generate = async () => {
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold">Тренировка</h1>
          <p className="text-muted-foreground">
            Lumos сгенерирует упражнения по текущему модулю — проверяй себя и лови XP.
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
  onChange,
  onReveal,
}: {
  index: number;
  item: ExerciseItem;
  value: string | undefined;
  revealed: boolean;
  onChange: (v: string) => void;
  onReveal: () => void;
}) {
  const correct = isCorrect(item, value);
  const showFeedback = revealed;
  return (
    <div
      className={cn(
        "rounded-xl border bg-muted/30 p-4 transition-colors",
        showFeedback && correct && "border-emerald-500/40 bg-emerald-500/5",
        showFeedback && !correct && value != null && value !== "" && "border-rose-500/40 bg-rose-500/5",
        !showFeedback && "border-border",
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        <span
          className={cn(
            "grid h-7 w-7 flex-none place-items-center rounded-full text-xs font-bold",
            showFeedback && correct
              ? "bg-emerald-500 text-white"
              : showFeedback && value
                ? "bg-rose-500 text-white"
                : "bg-gradient-to-br from-primary to-accent text-white",
          )}
        >
          {showFeedback && correct ? <Check className="h-3.5 w-3.5" /> : showFeedback && value ? <X className="h-3.5 w-3.5" /> : index}
        </span>
        <div className="text-sm font-medium leading-relaxed">{item.prompt}</div>
      </div>

      {item.type === "multiple_choice" && item.options ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {item.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                value === opt && !revealed && "border-primary ring-2 ring-primary/30",
                revealed && opt === expectedString(item) && "border-success bg-success/10 text-success",
                revealed && value === opt && opt !== expectedString(item) && "border-destructive bg-destructive/10 text-destructive",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : item.type === "true_false" ? (
        <div className="flex gap-2">
          {["True", "False"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "rounded-lg border border-border px-4 py-2 text-sm",
                value === opt && !revealed && "border-primary ring-2 ring-primary/30",
                revealed && opt === expectedString(item) && "border-success bg-success/10 text-success",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Твой ответ…"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
