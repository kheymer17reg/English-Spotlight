"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Eye, EyeOff, Loader2, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty";
import { ExportBar } from "@/components/teacher/export-bar";
import { GRADES, modulesByGrade } from "@/lib/curriculum";
import type { GeneratedTest, Grade } from "@/types";
import { cn } from "@/lib/utils";

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
  const [showAnswers, setShowAnswers] = useState(true);
  const modules = useMemo(() => modulesByGrade(grade), [grade]);
  const totalQuestions = useMemo(
    () => (test ? test.sections.reduce((s, sec) => s + sec.items.length, 0) : 0),
    [test],
  );

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
        <Card className="print:border-none print:shadow-none">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <Badge variant="accent" className="mb-1">
                  {grade} класс · {FORMATS.find((f) => f.v === format)?.label}
                </Badge>
                <CardTitle className="text-2xl">{test.title}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Заданий: <strong className="text-foreground">{totalQuestions}</strong></span>
                  <span aria-hidden>·</span>
                  <span>Максимум баллов: <strong className="text-foreground">{test.totalScore}</strong></span>
                  <span aria-hidden>·</span>
                  <span>Разделов: <strong className="text-foreground">{test.sections.length}</strong></span>
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
                <ExportBar text={asText} filename={`test-${grade}-${format}`} docxPayload={{ kind: "test", test, grade }} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-7">
            {test.sections.map((s, sIdx) => {
              // Continuous question numbering across sections (so students see 1..N).
              const startNum = test.sections
                .slice(0, sIdx)
                .reduce((acc, prev) => acc + prev.items.length, 0);
              return (
                <section key={s.heading} className="break-inside-avoid">
                  <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                    <Badge variant="primary" className="text-[10px] uppercase tracking-wider">
                      Раздел {sIdx + 1}
                    </Badge>
                    <h2 className="font-display text-lg font-semibold leading-tight">
                      {s.heading}
                    </h2>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {s.items.length} {s.items.length === 1 ? "задание" : s.items.length < 5 ? "задания" : "заданий"}
                    </span>
                  </div>
                  <ol className="space-y-3">
                    {s.items.map((it, i) => {
                      const num = startNum + i + 1;
                      const answer = Array.isArray(it.answer) ? it.answer.join(" — ") : String(it.answer);
                      return (
                        <li
                          key={it.id}
                          className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-primary/30 print:break-inside-avoid print:shadow-none"
                        >
                          <div className="flex items-start gap-3">
                            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white print:bg-foreground print:text-background">
                              {num}
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
                                <div className="mt-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                    Ответ:
                                  </span>{" "}
                                  <span className="font-medium text-foreground">{answer}</span>
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
                </section>
              );
            })}
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
