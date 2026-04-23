"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mic, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { GRADES } from "@/lib/curriculum";
import type { PronAttempt } from "@/lib/db";
import type { StudentRecord } from "@/types";
import { cn } from "@/lib/utils";

export default function TeacherPronunciationPage() {
  const [grade, setGrade] = useState(5);
  const [attempts, setAttempts] = useState<PronAttempt[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [prRes, stRes] = await Promise.all([
        fetch(`/api/pronunciation?grade=${grade}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/profile?grade=${grade}`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      setAttempts(prRes.attempts || []);
      setStudents(stRes.students || []);
    } finally {
      setLoading(false);
    }
  }, [grade]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const summary = useMemo(() => summarise(attempts, students), [attempts, students]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" /> Произношение класса
          </h1>
          <p className="text-muted-foreground">
            Агрегат результатов из Лингафонного кабинета — средняя точность, слабые слова, динамика.
          </p>
        </div>
        <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value))}>
          {GRADES.map((g) => (
            <option key={g} value={g}>{g} класс</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
        </div>
      ) : attempts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Попыток по произношению пока нет. Когда ученики {grade} класса начнут пользоваться
            Лингафонным кабинетом, здесь появится статистика.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Средняя точность" value={`${(summary.avg * 100).toFixed(0)}%`} hint={`по ${attempts.length} попыткам`} />
            <Stat label="Учеников участвовало" value={`${summary.perStudent.length}`} hint={`из ${students.length} в классе`} />
            <Stat label="Слабых слов" value={`${summary.weakWords.length}`} hint="повторяются в ошибках ≥ 2 раз" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>По ученикам</CardTitle>
              <CardDescription>Среднее, количество попыток и тренд (по последним 5 vs. предыдущим 5).</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Ученик</th>
                    <th className="py-2 pr-3 font-medium">Попыток</th>
                    <th className="py-2 pr-3 font-medium">Средняя</th>
                    <th className="py-2 pr-3 font-medium">Тренд</th>
                    <th className="py-2 pr-3 font-medium">Слабые слова</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.perStudent.map((s) => (
                    <tr key={s.studentId} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-medium">{s.name}</td>
                      <td className="py-2 pr-3">{s.count}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full",
                                s.avg >= 0.8 ? "bg-success" : s.avg >= 0.6 ? "bg-warning" : "bg-destructive",
                              )}
                              style={{ width: `${s.avg * 100}%` }}
                            />
                          </div>
                          <span className="tabular-nums">{(s.avg * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        {s.trend === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : s.trend > 0 ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <TrendingUp className="h-3.5 w-3.5" /> +{(s.trend * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <TrendingDown className="h-3.5 w-3.5" /> {(s.trend * 100).toFixed(0)}%
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {s.weakWords.slice(0, 4).map((w) => (
                            <span key={w} className="rounded bg-destructive/10 px-1.5 py-0.5 text-[11px] text-destructive">
                              {w}
                            </span>
                          ))}
                          {s.weakWords.length === 0 ? (
                            <span className="text-xs text-muted-foreground">нет</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Слова-провалы по классу</CardTitle>
              <CardDescription>Сколько раз ученики не произнесли слово правильно.</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.weakWords.length === 0 ? (
                <div className="text-sm text-muted-foreground">Пока нет систематических ошибок.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {summary.weakWords.map((w) => (
                    <Badge key={w.word} variant="destructive" className="gap-1">
                      {w.word}
                      <span className="rounded bg-destructive/20 px-1 text-[10px]">×{w.count}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
        {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

type PerStudent = {
  studentId: string;
  name: string;
  count: number;
  avg: number;
  trend: number; // diff between last-5 average and previous-5 average
  weakWords: string[];
};

function summarise(
  attempts: PronAttempt[],
  students: StudentRecord[],
): { avg: number; perStudent: PerStudent[]; weakWords: { word: string; count: number }[] } {
  if (!attempts.length) return { avg: 0, perStudent: [], weakWords: [] };
  const avg = attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length;

  const byStudent = new Map<string, PronAttempt[]>();
  for (const a of attempts) {
    const list = byStudent.get(a.studentId) ?? [];
    list.push(a);
    byStudent.set(a.studentId, list);
  }

  const nameLookup = new Map(students.map((s) => [s.id, s.name]));
  const perStudent: PerStudent[] = [];
  for (const [sid, list] of byStudent.entries()) {
    // DB already returns DESC by createdAt; re-sort defensively.
    const sortedDesc = list
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const last5 = sortedDesc.slice(0, 5);
    const prev5 = sortedDesc.slice(5, 10);
    const avgArr = (xs: PronAttempt[]) => (xs.length ? xs.reduce((s, a) => s + a.score, 0) / xs.length : 0);
    const trend = prev5.length ? avgArr(last5) - avgArr(prev5) : 0;
    const missedCount = new Map<string, number>();
    for (const a of list) for (const w of a.missedWords) {
      const k = w.toLowerCase();
      missedCount.set(k, (missedCount.get(k) ?? 0) + 1);
    }
    const weakWords = [...missedCount.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([w]) => w);
    perStudent.push({
      studentId: sid,
      name: nameLookup.get(sid) ?? sid.replace(/^demo-/, "").replace(/^./, (c) => c.toUpperCase()),
      count: list.length,
      avg: avgArr(list),
      trend,
      weakWords,
    });
  }
  perStudent.sort((a, b) => a.avg - b.avg);

  const classMissed = new Map<string, number>();
  for (const a of attempts) for (const w of a.missedWords) {
    const k = w.toLowerCase();
    classMissed.set(k, (classMissed.get(k) ?? 0) + 1);
  }
  const weakWords = [...classMissed.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  return { avg, perStudent, weakWords };
}
