"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty";
import { ExportBar } from "@/components/teacher/export-bar";
import { GRADES, modulesByGrade } from "@/lib/curriculum";
import type { GeneratedTest, Grade } from "@/types";

type Format = "progress_check" | "module_test" | "oge";
const FORMATS: { v: Format; label: string; desc: string }[] = [
  { v: "progress_check", label: "Progress Check", desc: "Короткая проверочная после раздела" },
  { v: "module_test", label: "Модульный тест", desc: "Полная контрольная по модулю" },
  { v: "oge", label: "Формат ОГЭ", desc: "Секции по модели ОГЭ (9 класс)" },
];

export default function TeacherTestsPage() {
  const [grade, setGrade] = useState<Grade>(6);
  const [format, setFormat] = useState<Format>("module_test");
  const [moduleNum, setModuleNum] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<GeneratedTest | null>(null);
  const modules = useMemo(() => modulesByGrade(grade), [grade]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setTest(null);
    try {
      const res = await fetch("/api/ai/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, format, module: moduleNum }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else setTest(data.test);
    } catch {
      setError("Сбой сети");
    } finally {
      setBusy(false);
    }
  };

  const asText = useMemo(() => (test ? testToText(test) : ""), [test]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">Тесты</h1>
        <p className="text-muted-foreground">Контрольные работы в нескольких форматах с ключом ответа.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {FORMATS.map((f) => (
          <button
            key={f.v}
            onClick={() => setFormat(f.v)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              format === f.v ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-muted"
            }`}
          >
            <div className="text-sm font-semibold">{f.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">{f.desc}</div>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-4">
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
          <Field label="Формат">
            <div className="flex h-10 items-center rounded-lg border border-border bg-surface px-3 text-sm">
              {FORMATS.find((f) => f.v === format)?.label}
            </div>
          </Field>
          <div className="self-end">
            <Button onClick={generate} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />} Собрать тест
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <Card><CardContent className="p-5 text-sm text-destructive">{error}</CardContent></Card> : null}
      {!test && !busy && !error ? (
        <EmptyState icon={ClipboardCheck} title="Тест ещё не сформирован" description="Выбери формат и нажми «Собрать тест»." />
      ) : null}

      {test ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="accent" className="mb-2">{grade} класс · {FORMATS.find((f) => f.v === format)?.label}</Badge>
                <CardTitle>{test.title}</CardTitle>
                <CardDescription>Максимум баллов: {test.totalScore}</CardDescription>
              </div>
              <ExportBar text={asText} filename={`test-${grade}-${format}`} docxPayload={{ kind: "test", test, grade }} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {test.sections.map((s) => (
              <div key={s.heading}>
                <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.heading}
                </div>
                <div className="space-y-3">
                  {s.items.map((it, i) => (
                    <div key={it.id} className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="text-sm">{i + 1}. {it.prompt}</div>
                      {it.options ? (
                        <ul className="mt-1 ml-4 list-[lower-alpha] space-y-0.5 text-sm">
                          {it.options.map((o) => <li key={o}>{o}</li>)}
                        </ul>
                      ) : null}
                      <div className="mt-1 text-xs text-success">Ответ: {Array.isArray(it.answer) ? it.answer.join(" — ") : it.answer}</div>
                    </div>
                  ))}
                </div>
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

function testToText(t: GeneratedTest): string {
  let out = `${t.title}\nМакс. балл: ${t.totalScore}\n\n`;
  for (const s of t.sections) {
    out += `== ${s.heading} ==\n`;
    s.items.forEach((it, i) => {
      out += `${i + 1}. ${it.prompt}\n`;
      if (it.options) out += it.options.map((o, j) => `   ${String.fromCharCode(97 + j)}) ${o}`).join("\n") + "\n";
      out += `   Ответ: ${Array.isArray(it.answer) ? it.answer.join(" — ") : it.answer}\n\n`;
    });
  }
  return out;
}
