"use client";

import * as React from "react";
import { BookOpen, Calendar, Flame, GraduationCap, Loader2, Sparkles, Target, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Period = "week" | "month" | "quarter" | "all";

interface Summary {
  student: {
    id: string;
    name: string;
    grade: number;
    streak: number;
    xp: number;
    level: number;
    currentModule: number;
  };
  period: Period;
  journal: {
    avg: number | null;
    marksByValue: Record<"2" | "3" | "4" | "5", number>;
    attendanceCounts: Record<"present" | "late" | "excused" | "absent", number>;
    totalMarks: number;
    timeline: {
      date: string;
      topic: string;
      mark: string | null;
      attendance: string;
      comment: string | null;
    }[];
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
  mistakes: { active: number; mastered: number; dueNow: number };
}

const PERIOD_LABELS: Record<Period, string> = {
  week: "неделя",
  month: "месяц",
  quarter: "четверть",
  all: "всё время",
};

const SKILL_LABELS: Record<string, string> = {
  grammar: "Грамматика",
  vocabulary: "Лексика",
  reading: "Чтение",
  listening: "Аудирование",
  speaking: "Говорение",
};

const ACTIVITY_LABELS: Record<string, string> = {
  vocab_review: "Словарь",
  exercise: "Упражнение",
  homework: "ДЗ",
  pronunciation: "Произношение",
  roleplay: "Ролевик",
  reading: "Чтение",
  listening: "Аудирование",
  game: "Игра",
  chat: "Чат Lumos",
  mistake_review: "Разбор ошибок",
};

export function StudentProfileDrawer({
  studentId,
  onClose,
}: {
  studentId: string | null;
  onClose: () => void;
}) {
  const [period, setPeriod] = React.useState<Period>("month");
  const [data, setData] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!studentId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/student/summary?id=${encodeURIComponent(studentId)}&period=${period}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d as Summary);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, period]);

  React.useEffect(() => {
    if (!studentId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [studentId, onClose]);

  if (!studentId) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col border-l border-border bg-surface shadow-lifted"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-none items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Профиль ученика
            </div>
            <div className="truncate font-display text-lg font-semibold">
              {data?.student.name ?? "…"}
            </div>
            {data?.student ? (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {data.student.grade} класс · модуль {data.student.currentModule}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-none items-center gap-1 border-b border-border px-4 py-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Период:
          </span>
          {(["week", "month", "quarter", "all"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                period === p
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
          {loading && !data ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка…
            </div>
          ) : !data ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Нет данных
            </div>
          ) : (
            <div className="space-y-5">
              {/* Top stat tiles */}
              <div className="grid grid-cols-2 gap-2">
                <StatTile
                  icon={<Sparkles className="h-4 w-4 text-primary" />}
                  label={`Ср. балл · ${PERIOD_LABELS[data.period]}`}
                  value={data.journal.avg !== null ? data.journal.avg.toFixed(2) : "—"}
                  tone={avgTone(data.journal.avg)}
                />
                <StatTile
                  icon={<Trophy className="h-4 w-4 text-accent" />}
                  label="XP / уровень"
                  value={`${data.activity.xpTotal} · L${data.student.level}`}
                  tone="primary"
                />
                <StatTile
                  icon={<Flame className="h-4 w-4 text-orange-500" />}
                  label="Стрик"
                  value={`${data.student.streak} д.`}
                  tone="warning"
                />
                <StatTile
                  icon={<Target className="h-4 w-4 text-rose-500" />}
                  label="Ошибки активные / на повтор"
                  value={`${data.mistakes.active} · ${data.mistakes.dueNow}`}
                  tone="rose"
                />
              </div>

              {/* Marks distribution */}
              <Section title="Оценки" hint={`${data.journal.totalMarks} за ${PERIOD_LABELS[data.period]}`}>
                <div className="grid grid-cols-4 gap-2">
                  {(["5", "4", "3", "2"] as const).map((m) => (
                    <div
                      key={m}
                      className="rounded-lg border border-border bg-surface/60 p-2.5 text-center"
                    >
                      <div className={cn("font-display text-lg font-semibold", markToneClass(m))}>
                        {data.journal.marksByValue[m]}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        «{m}»
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  <span>Посещаемость:</span>
                  <ChipNum
                    label="Присут."
                    value={data.journal.attendanceCounts.present}
                    tone="emerald"
                  />
                  <ChipNum
                    label="Опозд."
                    value={data.journal.attendanceCounts.late}
                    tone="amber"
                  />
                  <ChipNum
                    label="Уваж."
                    value={data.journal.attendanceCounts.excused}
                    tone="accent"
                  />
                  <ChipNum
                    label="Пропуск"
                    value={data.journal.attendanceCounts.absent}
                    tone="rose"
                  />
                </div>
              </Section>

              {/* Homework completion */}
              <Section title="Домашние задания">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Mini label="Всего" value={String(data.homework.total)} />
                  <Mini
                    label="Сдано"
                    value={String(data.homework.done)}
                    tone="emerald"
                  />
                  <Mini
                    label="Не сдано"
                    value={String(data.homework.pending)}
                    tone="rose"
                  />
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                    style={{
                      width:
                        data.homework.total > 0
                          ? `${Math.round((data.homework.done / data.homework.total) * 100)}%`
                          : "0%",
                    }}
                  />
                </div>
              </Section>

              {/* Skill accuracy bars */}
              {data.activity.skills.length > 0 ? (
                <Section title="Навыки (точность)">
                  <div className="space-y-1.5">
                    {data.activity.skills.map((s) => (
                      <div key={s.skill} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            {SKILL_LABELS[s.skill] ?? s.skill}
                          </span>
                          <span className="font-mono font-medium">
                            {Math.round(s.accuracy * 100)}%{" "}
                            <span className="text-muted-foreground">· {s.attempts}</span>
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full transition-all",
                              s.accuracy >= 0.8
                                ? "bg-emerald-500"
                                : s.accuracy >= 0.5
                                  ? "bg-amber-500"
                                  : "bg-rose-500",
                            )}
                            style={{ width: `${Math.round(s.accuracy * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              {/* Journal timeline */}
              {data.journal.timeline.length > 0 ? (
                <Section title="Последние уроки">
                  <ul className="space-y-1.5">
                    {data.journal.timeline.slice(0, 8).map((t, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-md border border-border bg-surface/50 px-2.5 py-1.5 text-xs"
                      >
                        <Calendar className="mt-0.5 h-3.5 w-3.5 flex-none text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {t.date}
                            </span>
                            <span className="truncate font-medium">{t.topic}</span>
                          </div>
                          {t.comment ? (
                            <div className="mt-0.5 italic text-muted-foreground">
                              «{t.comment}»
                            </div>
                          ) : null}
                        </div>
                        <MarkMini mark={t.mark} attendance={t.attendance} />
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {/* Activity feed */}
              {data.activity.recent.length > 0 ? (
                <Section
                  title="Активность"
                  hint={`+${data.activity.xpPeriod} XP за ${PERIOD_LABELS[data.period]}`}
                >
                  <ul className="space-y-1">
                    {data.activity.recent.slice(0, 10).map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <GraduationCap className="h-3 w-3" />
                          {ACTIVITY_LABELS[a.type] ?? a.type}
                          {a.total && a.correct !== null ? (
                            <span className="text-muted-foreground/70">
                              · {a.correct}/{a.total}
                            </span>
                          ) : null}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          +{a.xp} · {a.createdAt.slice(5, 16).replace("T", " ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  <BookOpen className="mx-auto mb-1 h-4 w-4" />
                  Ученик ещё не начинал занятия на платформе
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {hint ? <span className="text-[10px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary" | "emerald" | "warning" | "rose";
}) {
  const toneBg: Record<string, string> = {
    primary: "from-primary/10 to-accent/5 border-primary/20",
    emerald: "from-emerald-500/10 to-teal-500/5 border-emerald-500/25",
    warning: "from-amber-500/10 to-orange-500/5 border-amber-500/25",
    rose: "from-rose-500/10 to-pink-500/5 border-rose-500/25",
  };
  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br p-3",
        toneBg[tone] ?? toneBg.primary,
      )}
    >
      <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-display text-lg font-semibold">{value}</div>
    </div>
  );
}

function ChipNum({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "accent" | "rose";
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    accent: "bg-accent/15 text-accent-foreground",
    rose: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  };
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", colors[tone])}>
      {label} {value}
    </span>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "rose";
}) {
  const toneClass = tone
    ? tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-300"
      : "text-rose-600 dark:text-rose-300"
    : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-surface/60 p-2">
      <div className={cn("font-display text-lg font-semibold", toneClass)}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function MarkMini({ mark, attendance }: { mark: string | null; attendance: string }) {
  if (attendance === "absent") {
    return (
      <Badge variant="warning" className="h-6 font-semibold">
        Н
      </Badge>
    );
  }
  if (!mark) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn("font-display text-base font-semibold", markToneClass(mark))}>
      {mark}
    </span>
  );
}

function markToneClass(mark: string): string {
  if (mark === "5") return "text-emerald-600 dark:text-emerald-300";
  if (mark === "4") return "text-primary";
  if (mark === "3") return "text-amber-600 dark:text-amber-300";
  if (mark === "2") return "text-rose-600 dark:text-rose-300";
  return "text-foreground";
}

function avgTone(avg: number | null): "emerald" | "primary" | "warning" | "rose" {
  if (avg === null) return "primary";
  if (avg >= 4.5) return "emerald";
  if (avg >= 3.5) return "primary";
  if (avg >= 2.5) return "warning";
  return "rose";
}
