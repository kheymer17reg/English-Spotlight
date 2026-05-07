"use client";

import { useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty";
import { ExportBar } from "@/components/teacher/export-bar";
import { GRADES, modulesByGrade } from "@/lib/curriculum";
import type { Grade, LessonPlan } from "@/types";

const LESSON_TYPES = [
  "Ознакомление с новым материалом",
  "Урок-закрепление",
  "Урок-обобщение",
  "Урок контроля",
  "Комбинированный",
  "Урок-проект",
];

const FOCUSES = ["Грамматика", "Лексика", "Чтение", "Аудирование", "Говорение", "Письмо"];

export default function TeacherLessonsPage() {
  const [grade, setGrade] = useState<Grade>(5);
  const [moduleNum, setModuleNum] = useState(1);
  const [lessonType, setLessonType] = useState(LESSON_TYPES[0]);
  const [focus, setFocus] = useState(FOCUSES[0]);
  const [duration, setDuration] = useState(45);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<LessonPlan | null>(null);

  const modules = useMemo(() => modulesByGrade(grade), [grade]);
  const asText = useMemo(() => (plan ? lessonToText(plan) : ""), [plan]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/ai/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, module: moduleNum, lessonType, focus, duration }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else setPlan(data.plan);
    } catch {
      setError("Сбой сети");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">Планы уроков</h1>
        <p className="text-muted-foreground">Технологические карты по ФГОС: цели, этапы, материалы, домашнее задание.</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-5">
          <Field label="Класс">
            <Select value={String(grade)} onChange={(e) => { setGrade(Number(e.target.value) as Grade); setModuleNum(1); }}>
              {GRADES.map((g) => <option key={g} value={g}>{g} класс</option>)}
            </Select>
          </Field>
          <Field label="Модуль">
            <Select value={String(moduleNum)} onChange={(e) => setModuleNum(Number(e.target.value))}>
              {modules.map((m) => <option key={m.id} value={m.number}>{m.number}. {m.title}</option>)}
            </Select>
          </Field>
          <Field label="Тип урока">
            <Select value={lessonType} onChange={(e) => setLessonType(e.target.value)}>
              {LESSON_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Фокус">
            <Select value={focus} onChange={(e) => setFocus(e.target.value)}>
              {FOCUSES.map((f) => <option key={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="Мин.">
            <Input type="number" min={20} max={90} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </Field>
          <div className="md:col-span-5">
            <Button onClick={generate} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Сгенерировать план
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <Card><CardContent className="p-5 text-sm text-destructive">{error}</CardContent></Card> : null}
      {!plan && !busy && !error ? (
        <EmptyState icon={FileText} title="План ещё не создан" description="Задай параметры и получи готовую тех. карту." />
      ) : null}

      {plan ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="success" className="mb-2">{grade} класс · Модуль {moduleNum} · {duration} мин</Badge>
                <CardTitle>{plan.title}</CardTitle>
                <CardDescription>Тип: {plan.lessonType} · Фокус: {plan.focus}</CardDescription>
              </div>
              <ExportBar text={asText} filename={`lesson-${grade}-${moduleNum}`} docxPayload={{ kind: "lesson", plan, grade }} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-[2fr_1fr]">
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Этапы</div>
              <div className="space-y-2">
                {plan.stages.map((st, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                      {st.minutes}’
                    </span>
                    <div>
                      <div className="text-sm font-medium">{st.stage}</div>
                      <div className="text-sm text-muted-foreground">{st.activity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Цели</div>
                <ul className="space-y-1.5 text-sm">
                  {plan.objectives.map((o) => (
                    <li key={o} className="flex items-start gap-2">
                      <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-primary" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Материалы</div>
                <ul className="space-y-1.5 text-sm">
                  {plan.materials.map((m) => <li key={m}>• {m}</li>)}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">ДЗ</div>
                <p className="text-sm text-muted-foreground">{plan.homework}</p>
              </div>
            </div>
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

function lessonToText(p: LessonPlan): string {
  let out = `${p.title}\n${p.grade} класс · Модуль ${p.module} · ${p.duration} минут\n`;
  out += `Тип: ${p.lessonType}. Фокус: ${p.focus}\n\n`;
  out += `Цели:\n${p.objectives.map((o) => `• ${o}`).join("\n")}\n\n`;
  out += `Этапы:\n${p.stages.map((s) => `${s.minutes} мин — ${s.stage}: ${s.activity}`).join("\n")}\n\n`;
  out += `Материалы:\n${p.materials.map((m) => `• ${m}`).join("\n")}\n\n`;
  out += `Домашнее задание: ${p.homework}\n`;
  return out;
}
