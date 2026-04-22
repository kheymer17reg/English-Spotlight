"use client";

import { useMemo, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty";
import { ExportBar } from "@/components/teacher/export-bar";
import { GRADES, modulesByGrade } from "@/lib/curriculum";
import type { Difficulty, ExerciseType, GeneratedExercise, Grade } from "@/types";

const TYPES: { value: ExerciseType; label: string }[] = [
  { value: "multiple_choice", label: "Тест (4 варианта)" },
  { value: "fill_blank", label: "Заполни пропуски" },
  { value: "match_pairs", label: "Соедини пары" },
  { value: "open_ended", label: "Открытый вопрос" },
  { value: "true_false", label: "Верно / неверно" },
];

export default function TeacherGeneratePage() {
  const [grade, setGrade] = useState<Grade>(5);
  const [moduleNum, setModuleNum] = useState(1);
  const [type, setType] = useState<ExerciseType>("multiple_choice");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ex, setEx] = useState<GeneratedExercise | null>(null);

  const modules = useMemo(() => modulesByGrade(grade), [grade]);
  const asText = useMemo(() => (ex ? exerciseToText(ex) : ""), [ex]);

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
      <div>
        <h1 className="font-display text-3xl font-semibold">Генератор упражнений</h1>
        <p className="text-muted-foreground">
          Укажи параметры и получи готовое задание с ключом ответа, подсказками и объяснениями.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-5">
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
          <Field label="Тип">
            <Select value={type} onChange={(e) => setType(e.target.value as ExerciseType)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Сложность">
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option value="easy">Лёгкая</option>
              <option value="medium">Средняя</option>
              <option value="hard">Сложная</option>
            </Select>
          </Field>
          <Field label="Количество">
            <Input type="number" min={3} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </Field>
          <div className="md:col-span-5">
            <Button onClick={generate} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Сгенерировать
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
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="primary" className="mb-2">{grade} класс · Модуль {moduleNum}</Badge>
                <CardTitle>{ex.title}</CardTitle>
                <CardDescription>{ex.items.length} заданий · {TYPES.find((t) => t.value === ex.type)?.label}</CardDescription>
              </div>
              <ExportBar
                text={asText}
                filename={`exercise-${grade}-${moduleNum}`}
                docxPayload={{ kind: "exercise", exercise: ex, grade, module: moduleNum }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ex.items.map((it, i) => (
              <div key={it.id} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-1.5 text-sm font-medium">{i + 1}. {it.prompt}</div>
                {it.options ? (
                  <ul className="ml-4 list-[lower-alpha] space-y-0.5 text-sm">
                    {it.options.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-2 text-xs text-success">
                  Ответ: {Array.isArray(it.answer) ? it.answer.join(" — ") : it.answer}
                </div>
                {it.explanation ? <div className="mt-1 text-xs text-muted-foreground">{it.explanation}</div> : null}
              </div>
            ))}
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
