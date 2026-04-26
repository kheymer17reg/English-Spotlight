"use client";

/**
 * Parent's view of one child: read-only summary.
 *
 * Reuses the same aggregator the teacher journal uses (`/api/student/summary`),
 * proxied through `/api/parent/child/[id]/summary` which enforces that the
 * signed-in parent is bound to the requested student.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Brain,
  ClipboardList,
  Flame,
  Loader2,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Period = "week" | "month" | "quarter" | "all";

interface SummaryResponse {
  student: { id: string; name: string; grade: number; xp: number; level: number; streak: number };
  period: Period;
  journal: {
    avg: number | null;
    marksByValue: Record<"2" | "3" | "4" | "5", number>;
    attendanceCounts: Record<"present" | "late" | "excused" | "absent", number>;
    totalMarks: number;
    timeline: { date: string; topic: string; mark: string | null; attendance: string; comment: string | null }[];
  };
  homework: { total: number; done: number; pending: number };
  activity: {
    xpTotal: number;
    xpPeriod: number;
    skills: { skill: string; accuracy: number; attempts: number }[];
    recent: {
      id: number;
      type: string;
      xp: number;
      correct: number | null;
      total: number | null;
      skill: string | null;
      createdAt: string;
    }[];
  };
  mistakes?: { active?: number; mastered?: number; topTopics?: { topic: string; count: number }[] };
}

const PERIOD_LABELS: Record<Period, string> = {
  week: "Неделя",
  month: "Месяц",
  quarter: "Четверть",
  all: "Всё время",
};

const SKILL_LABELS: Record<string, string> = {
  grammar: "Грамматика",
  vocabulary: "Словарь",
  reading: "Чтение",
  listening: "Аудирование",
  speaking: "Говорение",
};

function avgColor(avg: number | null): string {
  if (avg === null) return "text-muted-foreground";
  if (avg >= 4.5) return "text-emerald-600";
  if (avg >= 3.5) return "text-amber-600";
  return "text-rose-600";
}

export default function ParentChildPage({ params }: { params: { id: string } }) {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const r = await fetch(
          `/api/parent/child/${encodeURIComponent(params.id)}/summary?period=${period}`,
          { cache: "no-store" },
        );
        if (!r.ok) {
          const body = (await r.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) setError(body.error ?? "Не удалось загрузить");
          return;
        }
        const body = (await r.json()) as SummaryResponse;
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setError("Сеть недоступна. Попробуй ещё раз.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, period]);

  const marksRow = useMemo(() => {
    if (!data) return null;
    const total = Object.values(data.journal.marksByValue).reduce((a, b) => a + b, 0);
    return { ...data.journal.marksByValue, total };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загружаем профиль…
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <div className="text-sm text-rose-600">{error ?? "Профиль не найден"}</div>
          <Link href="/parent">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> К детям
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const s = data.student;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/parent" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> К списку детей
          </Link>
          <h1 className="font-display text-3xl font-semibold">{s.name}</h1>
          <p className="text-muted-foreground">
            {s.grade} класс · уровень {s.level} · {s.xp} XP · стрик {s.streak} д.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1 text-xs">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-2.5 py-1 transition-colors",
                period === p ? "bg-surface font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Star className="h-4 w-4 text-primary" />}
          label="Средний балл"
          value={data.journal.avg !== null ? data.journal.avg.toFixed(2) : "—"}
          valueClass={avgColor(data.journal.avg)}
          hint={`${data.journal.totalMarks} оценок`}
        />
        <StatCard
          icon={<Trophy className="h-4 w-4 text-amber-500" />}
          label="XP за период"
          value={String(data.activity.xpPeriod)}
          hint={`всего ${data.activity.xpTotal}`}
        />
        <StatCard
          icon={<ClipboardList className="h-4 w-4 text-sky-500" />}
          label="ДЗ"
          value={`${data.homework.done}/${data.homework.total}`}
          hint={data.homework.pending > 0 ? `висит ${data.homework.pending}` : "всё сдано"}
          valueClass={data.homework.pending > 0 ? "text-amber-600" : "text-emerald-600"}
        />
        <StatCard
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          label="Пропуски"
          value={String(data.journal.attendanceCounts.absent)}
          hint={`опозданий ${data.journal.attendanceCounts.late}`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Award className="h-4 w-4 text-primary" /> Распределение оценок
            </div>
            {marksRow && marksRow.total > 0 ? (
              <div className="space-y-2">
                {(["5", "4", "3", "2"] as const).map((m) => {
                  const count = data.journal.marksByValue[m];
                  const pct = marksRow.total ? (count / marksRow.total) * 100 : 0;
                  return (
                    <div key={m} className="flex items-center gap-2 text-xs">
                      <span className="w-3 font-mono font-semibold">{m}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full",
                            m === "5"
                              ? "bg-emerald-500"
                              : m === "4"
                              ? "bg-sky-500"
                              : m === "3"
                              ? "bg-amber-500"
                              : "bg-rose-500",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">За период оценок ещё нет.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Brain className="h-4 w-4 text-violet-500" /> Точность по навыкам
            </div>
            {data.activity.skills.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Пока мало данных — попроси ребёнка сделать пару упражнений.
              </div>
            ) : (
              <div className="space-y-2">
                {data.activity.skills.map((s) => (
                  <div key={s.skill} className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted-foreground">
                      {SKILL_LABELS[s.skill] ?? s.skill}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full",
                          s.accuracy >= 80
                            ? "bg-emerald-500"
                            : s.accuracy >= 60
                            ? "bg-sky-500"
                            : s.accuracy >= 40
                            ? "bg-amber-500"
                            : "bg-rose-500",
                        )}
                        style={{ width: `${s.accuracy}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-medium">{s.accuracy}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-primary" /> Журнал ({data.journal.timeline.length})
          </div>
          {data.journal.timeline.length === 0 ? (
            <div className="text-sm text-muted-foreground">За выбранный период записей ещё нет.</div>
          ) : (
            <div className="divide-y divide-border">
              {data.journal.timeline.slice(0, 12).map((row, i) => (
                <div key={i} className="flex items-start gap-3 py-2 text-sm">
                  <div className="w-20 flex-none text-xs text-muted-foreground">
                    {new Date(row.date).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{row.topic}</div>
                    {row.comment ? (
                      <div className="truncate text-xs text-muted-foreground">{row.comment}</div>
                    ) : null}
                  </div>
                  <div className="flex-none">
                    {row.attendance === "absent" ? (
                      <Badge variant="outline" className="border-rose-500/30 text-rose-600">
                        Н
                      </Badge>
                    ) : row.mark ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-sm",
                          row.mark === "5"
                            ? "border-emerald-500/40 text-emerald-700"
                            : row.mark === "4"
                            ? "border-sky-500/40 text-sky-700"
                            : row.mark === "3"
                            ? "border-amber-500/40 text-amber-700"
                            : "border-rose-500/40 text-rose-700",
                        )}
                      >
                        {row.mark}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data.mistakes?.topTopics && data.mistakes.topTopics.length > 0 ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-rose-500" /> Над чем стоит поработать
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.mistakes.topTopics.slice(0, 8).map((t) => (
                <Badge key={t.topic} variant="outline" className="gap-1 text-xs">
                  {t.topic} <span className="text-muted-foreground">×{t.count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon} {label}
        </div>
        <div className={cn("font-display text-2xl font-semibold", valueClass)}>{value}</div>
        {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}
