"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  GitCompare,
  Lightbulb,
  ListChecks,
  Loader2,
  PencilLine,
  Printer,
  ToggleLeft,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty";
import { ExportBar } from "@/components/teacher/export-bar";
import { GRADES, modulesByGrade } from "@/lib/curriculum";
import type { Difficulty, ExerciseType, GeneratedExercise, Grade } from "@/types";
import { cn } from "@/lib/utils";

type IconCmp = typeof ListChecks;

const TYPES: { value: ExerciseType; label: string; icon: IconCmp; hint: string }[] = [
  { value: "multiple_choice", label: "Тест (4 варианта)", icon: ListChecks, hint: "Один правильный из четырёх" },
  { value: "fill_blank", label: "Заполни пропуски", icon: PencilLine, hint: "Cloze — слово в пропуск" },
  { value: "match_pairs", label: "Соедини пары", icon: GitCompare, hint: "Слово ↔ перевод" },
  { value: "open_ended", label: "Открытый вопрос", icon: Lightbulb, hint: "Свободный ответ" },
  { value: "true_false", label: "Верно / неверно", icon: ToggleLeft, hint: "Утверждение T/F" },
];

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: "Лёгкая",
  medium: "Средняя",
  hard: "Сложная",
};

export default function TeacherGeneratePage() {
  const [grade, setGrade] = useState<Grade>(5);
  const [moduleNum, setModuleNum] = useState(1);
  const [type, setType] = useState<ExerciseType>("multiple_choice");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ex, setEx] = useState<GeneratedExercise | null>(null);
  const [showAnswers, setShowAnswers] = useState(true);

  const modules = useMemo(() => modulesByGrade(grade), [grade]);
  const asText = useMemo(() => (ex ? exerciseToText(ex) : ""), [ex]);
  const currentType = useMemo(() => TYPES.find((t) => t.value === type), [type]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setEx(null);
    try {
      const res = await fetch("/api/ai/generate-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, module: moduleNum, type, difficulty, count }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Ошибка");
      else setEx(data.exercise);
    } catch {
      setError("Сбой сети");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
          <Wand2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold">Генератор упражнений</h1>
          <p className="text-muted-foreground">
            Укажи параметры — Lumos соберёт задание с ключом, подсказками и объяснениями.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Тип упражнения
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const active = type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={cn(
                      "group flex h-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border bg-surface hover:border-primary/40 hover:bg-muted",
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-9 w-9 flex-none place-items-center rounded-lg transition-colors",
                        active
                          ? "bg-gradient-to-br from-primary to-accent text-white"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold leading-tight">{t.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{t.hint}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Класс">
              <Select value={String(grade)} onChange={(e) => { setGrade(Number(e.target.value) as Grade); setModuleNum(1); }}>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g} класс</option>
                ))}
              </Select>
            </Field>
            <Field label="Модуль">
              <Select value={String(moduleNum)} onChange={(e) => setModuleNum(Number(e.target.value))}>
                {modules.map((m) => (
                  <option key={m.id} value={m.number}>{m.number}. {m.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Сложность">
              <div className="flex h-10 items-center gap-1 rounded-lg border border-border bg-surface p-1">
                {(Object.keys(DIFF_LABEL) as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "flex-1 rounded-md px-2 text-xs font-medium transition-colors",
                      difficulty === d
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-soft"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {DIFF_LABEL[d]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={`Количество — ${count}`}>
              <Input
                type="range"
                min={3}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="cursor-pointer"
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">
              Буду генерировать <strong className="text-foreground">{count}</strong>{" "}
              {currentType ? `· ${currentType.label.toLowerCase()}` : ""} ·{" "}
              <strong className="text-foreground">{DIFF_LABEL[difficulty].toLowerCase()}</strong> сложности
            </div>
            <Button onClick={generate} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {busy ? "Генерирую…" : "Сгенерировать"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {!ex && !busy && !error ? (
        <EmptyState icon={Wand2} title="Ещё ничего не сгенерировано" description="Задай параметры выше и нажми «Сгенерировать»." />
      ) : null}

      {ex ? (
        <Card className="print:border-none print:shadow-none">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">{grade} класс · Модуль {moduleNum}</Badge>
                  <Badge variant="accent">{currentType?.label}</Badge>
                  <Badge variant="outline">{DIFF_LABEL[difficulty]}</Badge>
                </div>
                <CardTitle className="text-2xl">{ex.title}</CardTitle>
                <CardDescription>
                  {ex.items.length} {ex.items.length === 1 ? "задание" : ex.items.length < 5 ? "задания" : "заданий"}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswers((v) => !v)}
                  className="gap-2"
                >
                  {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showAnswers ? "Скрыть ответы" : "Показать ответы"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" /> Печать
                </Button>
                <ExportBar
                  text={asText}
                  filename={`exercise-${grade}-${moduleNum}`}
                  docxPayload={{ kind: "exercise", exercise: ex, grade, module: moduleNum }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {ex.items.map((it, i) => {
                const answer = Array.isArray(it.answer) ? it.answer.join(" — ") : String(it.answer);
                return (
                  <li
                    key={it.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-primary/30 print:break-inside-avoid print:shadow-none"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white print:bg-foreground print:text-background">
                        {i + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <p className="text-base leading-relaxed">{it.prompt}</p>
                        {it.options ? (
                          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
                            {it.options.map((o, j) => {
                              const isCorrect = showAnswers && (
                                Array.isArray(it.answer)
                                  ? it.answer.includes(o)
                                  : it.answer === o
                              );
                              return (
                                <li
                                  key={o}
                                  className={cn(
                                    "flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 leading-snug",
                                    isCorrect && "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 print:bg-transparent print:text-foreground",
                                  )}
                                >
                                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                                    {String.fromCharCode(97 + j)})
                                  </span>
                                  <span className="flex-1">{o}</span>
                                  {isCorrect ? <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500" /> : null}
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                        {showAnswers ? (
                          <div className="space-y-1.5">
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
                              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Ответ:
                              </span>{" "}
                              <span className="font-medium text-foreground">{answer}</span>
                            </div>
                            {it.hint ? (
                              <div className="text-xs text-muted-foreground">
                                <Lightbulb className="mr-1 inline h-3 w-3" /> {it.hint}
                              </div>
                            ) : null}
                            {it.explanation ? (
                              <div className="text-xs text-muted-foreground">{it.explanation}</div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mt-1 h-8 rounded-lg border border-dashed border-border print:h-12" aria-label="Место для ответа" />
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function exerciseToText(ex: GeneratedExercise): string {
  let out = `${ex.title}\n${ex.grade} класс · Модуль ${ex.module} · ${ex.type}\n\n`;
  ex.items.forEach((it, i) => {
    out += `${i + 1}. ${it.prompt}\n`;
    if (it.options) {
      out += it.options.map((o, j) => `   ${String.fromCharCode(97 + j)}) ${o}`).join("\n") + "\n";
    }
    out += `   Ответ: ${Array.isArray(it.answer) ? it.answer.join(" — ") : it.answer}\n`;
    if (it.explanation) out += `   (${it.explanation})\n`;
    out += "\n";
  });
  return out;
}
