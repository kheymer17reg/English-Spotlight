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
      <div>
        <Link href="/parent" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> К списку детей
        </Link>
      </div>

      {/* Hero with avatar + level + streak */}
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-br from-primary/15 via-surface to-accent/15 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-full bg-gradient-to-tr from-primary via-accent to-primary p-[3px]">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-surface font-display text-xl font-bold">
                {parentInitials(s.name)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-semibold">{s.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-medium">{s.grade} класс</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  <Star className="h-3 w-3" /> уровень {s.level}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 font-semibold text-orange-600 dark:text-orange-400">
                  <Flame className="h-3 w-3" /> стрик {s.streak} {s.streak === 1 ? "день" : "дней"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <Trophy className="h-3 w-3" /> {s.xp} XP
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1 text-xs">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 transition-colors",
                    period === p ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="primary"
          icon={<Star className="h-4 w-4" />}
          label="Средний балл"
          value={data.journal.avg !== null ? data.journal.avg.toFixed(2) : "—"}
          valueClass={avgColor(data.journal.avg)}
          hint={`${data.journal.totalMarks} оценок`}
        />
        <StatCard
          tone={data.homework.pending > 0 ? "amber" : "emerald"}
          icon={<ClipboardList className="h-4 w-4" />}
          label="Домашнее задание"
          value={`${data.homework.done}/${data.homework.total}`}
          hint={data.homework.pending > 0 ? `висит ${data.homework.pending}` : "всё сдано"}
          valueClass={data.homework.pending > 0 ? "text-amber-600" : "text-emerald-600"}
        />
        {(() => {
          const top = [...data.activity.skills].sort((a, b) => b.accuracy - a.accuracy)[0];
          return (
            <StatCard
              tone="violet"
              icon={<Brain className="h-4 w-4" />}
              label="Лучший навык"
              value={top ? (SKILL_LABELS[top.skill] ?? top.skill) : "—"}
              hint={top ? `${Math.round(top.accuracy)}% · ${top.attempts} попыт.` : "Нет данных"}
            />
          );
        })()}
        <StatCard
          tone="orange"
          icon={<Flame className="h-4 w-4" />}
          label="Пропуски"
          value={String(data.journal.attendanceCounts.absent)}
          hint={`опозданий ${data.journal.attendanceCounts.late}`}
          valueClass={data.journal.attendanceCounts.absent > 0 ? "text-rose-600" : "text-emerald-600"}
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

function parentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

type StatTone = "primary" | "amber" | "emerald" | "violet" | "orange" | "sky";

const TONE_STYLES: Record<StatTone, { ring: string; bg: string; icon: string }> = {
  primary: { ring: "border-primary/20", bg: "bg-primary/10", icon: "text-primary" },
  amber: { ring: "border-amber-500/30", bg: "bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400" },
  emerald: { ring: "border-emerald-500/30", bg: "bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400" },
  violet: { ring: "border-violet-500/30", bg: "bg-violet-500/10", icon: "text-violet-600 dark:text-violet-400" },
  orange: { ring: "border-orange-500/30", bg: "bg-orange-500/10", icon: "text-orange-600 dark:text-orange-400" },
  sky: { ring: "border-sky-500/30", bg: "bg-sky-500/10", icon: "text-sky-600 dark:text-sky-400" },
};

function StatCard({
  icon,
  label,
  value,
  valueClass,
  hint,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  hint?: string;
  tone?: StatTone;
}) {
  const t = TONE_STYLES[tone];
  return (
    <Card className={cn("overflow-hidden", t.ring)}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={cn("grid h-10 w-10 flex-none place-items-center rounded-xl", t.bg, t.icon)}>
          {icon}
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={cn("truncate font-display text-2xl font-semibold leading-tight", valueClass)}>
            {value}
          </div>
          {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
