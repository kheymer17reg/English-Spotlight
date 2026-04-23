"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Brain,
  Ear,
  Crown,
  Flame,
  GraduationCap,
  Headphones,
  LineChart,
  Loader2,
  Medal,
  MessageCircle,
  Mic,
  Pencil,
  Rocket,
  ScrollText,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import type { ActivityRecord, BadgeDefinition, StudentProgressReport } from "@/types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<BadgeDefinition["icon"], LucideIcon> = {
  flame: Flame,
  star: Star,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  award: Award,
  sparkles: Sparkles,
  target: Target,
  zap: Zap,
  rocket: Rocket,
};

const SKILL_LABELS: Record<string, string> = {
  grammar: "Грамматика",
  vocabulary: "Словарь",
  reading: "Чтение",
  listening: "Аудирование",
  speaking: "Говорение",
};

const SKILL_THEME: Record<
  string,
  { icon: LucideIcon; from: string; to: string; text: string; tint: string }
> = {
  grammar: {
    icon: Pencil,
    from: "from-sky-500",
    to: "to-indigo-500",
    text: "text-sky-500",
    tint: "bg-sky-500/10",
  },
  vocabulary: {
    icon: Brain,
    from: "from-violet-500",
    to: "to-fuchsia-500",
    text: "text-violet-500",
    tint: "bg-violet-500/10",
  },
  reading: {
    icon: BookOpen,
    from: "from-emerald-500",
    to: "to-teal-500",
    text: "text-emerald-500",
    tint: "bg-emerald-500/10",
  },
  listening: {
    icon: Headphones,
    from: "from-amber-500",
    to: "to-orange-500",
    text: "text-amber-500",
    tint: "bg-amber-500/10",
  },
  speaking: {
    icon: Mic,
    from: "from-rose-500",
    to: "to-pink-500",
    text: "text-rose-500",
    tint: "bg-rose-500/10",
  },
};

const ACTIVITY_LABELS: Record<string, string> = {
  vocab_review: "Словарь",
  exercise: "Упражнение",
  homework: "Домашка",
  pronunciation: "Произношение",
  roleplay: "Ролевик",
  reading: "Чтение",
  listening: "Аудирование",
  game: "Игра",
  chat: "Чат с Lumos",
  mistake_review: "Работа над ошибками",
};

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  vocab_review: Brain,
  exercise: Pencil,
  homework: ScrollText,
  pronunciation: Mic,
  roleplay: MessageCircle,
  reading: BookOpen,
  listening: Ear,
  game: Sparkles,
  chat: MessageCircle,
  mistake_review: Target,
};

const XP_PER_LEVEL = 200;

export default function ProgressPage() {
  const router = useRouter();
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const [report, setReport] = useState<StudentProgressReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student === null) router.replace("/");
  }, [student, router]);

  useEffect(() => {
    if (!student) return;
    let alive = true;
    setLoading(true);
    fetch(`/api/student/progress?studentId=${student.id}`)
      .then((r) => r.json())
      .then((j: StudentProgressReport) => {
        if (!alive) return;
        setReport(j);
        updateStudent({
          xp: j.student.xp,
          level: j.student.level,
          streak: j.student.streak,
        });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [student, updateStudent]);

  const weeklyMax = useMemo(() => {
    if (!report) return 1;
    return Math.max(1, ...report.weeklyXp.map((d) => d.xp));
  }, [report]);

  if (!student) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Прогресс</h1>
          <p className="text-muted-foreground">Реальная картина по твоим занятиям</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/student/mistakes">
            <Button variant="outline" size="sm" className="gap-2">
              <Target className="h-4 w-4" /> Мои ошибки
            </Button>
          </Link>
          <Link href="/student/league">
            <Button variant="outline" size="sm" className="gap-2">
              <Trophy className="h-4 w-4" /> Лига недели
            </Button>
          </Link>
        </div>
      </div>

      {loading || !report ? (
        <Card>
          <CardContent className="grid place-items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <HeroStats report={report} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>Точность по навыкам</CardTitle>
                  <CardDescription>Среднее % правильных ответов</CardDescription>
                </div>
                <Badge variant="primary" className="gap-1">
                  <LineChart className="h-3 w-3" /> По всем упражнениям
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.skills.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Сделай первое упражнение — появится статистика по навыкам.
                </div>
              ) : (
                report.skills.map((s) => {
                  const theme = SKILL_THEME[s.skill] ?? {
                    icon: Sparkles,
                    from: "from-primary",
                    to: "to-accent",
                    text: "text-primary",
                    tint: "bg-primary/10",
                  };
                  const Icon = theme.icon;
                  return (
                    <div key={s.skill}>
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "grid h-7 w-7 place-items-center rounded-lg",
                              theme.tint,
                              theme.text,
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">
                            {SKILL_LABELS[s.skill] ?? s.skill}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          <span className={cn("font-semibold", theme.text)}>
                            {s.accuracy}%
                          </span>{" "}
                          <span className="text-xs">· {s.attempts} подх.</span>
                        </span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "skill-bar-fill absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-all",
                            theme.from,
                            theme.to,
                          )}
                          style={{ "--v": s.accuracy } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>XP за последние 7 дней</CardTitle>
                  <CardDescription>Ежедневный вклад в стрик</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="h-3 w-3" /> {report.student.xpThisWeek} XP / нед
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex h-[160px] items-end gap-2 sm:gap-3">
                {report.weeklyXp.map((d) => {
                  const h = d.xp > 0 ? Math.max(6, (d.xp / weeklyMax) * 128) : 4;
                  return (
                    <div key={d.day} className="group flex flex-1 flex-col items-center gap-1.5">
                      <div className="w-full text-center text-[11px] tabular-nums text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100">
                        {d.xp}
                      </div>
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all",
                          d.xp > 0
                            ? "bg-gradient-to-t from-primary/70 via-primary to-accent group-hover:from-primary group-hover:to-accent"
                            : "bg-muted",
                        )}
                        style={{ height: `${h}px` }}
                        title={`${d.day}: ${d.xp} XP`}
                      />
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {formatDayShort(d.day)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>Бейджи</CardTitle>
                  <CardDescription>
                    Открыто {report.badges.unlocked.length} из{" "}
                    {report.badges.unlocked.length + report.badges.locked.length}
                  </CardDescription>
                </div>
                <Badge variant="primary" className="gap-1">
                  <Sparkles className="h-3 w-3" /> достижения
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {[...report.badges.unlocked, ...report.badges.locked].map((b) => {
                const unlocked = "unlockedAt" in b;
                const Icon = ICON_MAP[b.icon] ?? Award;
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border p-4 transition-all",
                      unlocked
                        ? "border-primary/30 bg-gradient-to-br from-primary/5 via-surface to-accent/5 glow-soft"
                        : "border-border bg-muted/20 opacity-70",
                    )}
                  >
                    {unlocked ? (
                      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />
                    ) : null}
                    <div className="relative flex items-start gap-3">
                      <div
                        className={cn(
                          "grid h-11 w-11 flex-none place-items-center rounded-xl",
                          unlocked
                            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{b.title}</div>
                        <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                          {b.description}
                        </div>
                        {unlocked ? (
                          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                            <Sparkles className="h-3 w-3" /> получено
                          </div>
                        ) : (
                          <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            ещё закрыто
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Последние занятия</CardTitle>
              <CardDescription>20 последних действий</CardDescription>
            </CardHeader>
            <CardContent>
              {report.recent.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Пока пусто. Начни с тренировки или словаря.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {report.recent.map((a) => (
                    <ActivityRow key={a.id} a={a} />
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

function HeroStats({ report }: { report: StudentProgressReport }) {
  const levelXp = report.student.xp % XP_PER_LEVEL;
  const pct = Math.round((levelXp / XP_PER_LEVEL) * 100);
  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-surface to-accent/10">
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <LevelRing level={report.student.level} pct={pct} />
          <div className="flex flex-col justify-center gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Привет,</div>
              <div className="font-display text-2xl font-semibold">
                {report.student.name}!
              </div>
              <div className="text-sm text-muted-foreground">
                {report.student.grade} класс · до уровня {report.student.level + 1}{" "}
                осталось <span className="font-semibold text-primary">
                  {XP_PER_LEVEL - levelXp} XP
                </span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniStat
                icon={<Flame className="h-4 w-4 text-orange-500 flame-pulse" />}
                label="Стрик"
                value={`${report.student.streak} дн`}
                tint="from-orange-500/10 to-amber-500/5"
              />
              <MiniStat
                icon={<Zap className="h-4 w-4 text-primary" />}
                label="Всего XP"
                value={`${report.student.xp}`}
                tint="from-primary/10 to-accent/5"
              />
              <MiniStat
                icon={<Target className="h-4 w-4 text-emerald-500" />}
                label="Ошибок освоено"
                value={`${report.mistakes.mastered}`}
                tint="from-emerald-500/10 to-teal-500/5"
                sub={`в работе ${report.mistakes.active}`}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LevelRing({ level, pct }: { level: number; pct: number }) {
  return (
    <div className="relative mx-auto h-[140px] w-[140px]">
      <div
        className="ring-gauge absolute inset-0 rounded-full"
        style={{ "--progress": pct } as React.CSSProperties}
      />
      <div className="absolute inset-[10px] grid place-items-center rounded-full bg-surface shadow-soft">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            уровень
          </div>
          <div className="font-display text-4xl font-bold text-primary">{level}</div>
          <div className="text-[10px] tabular-nums text-muted-foreground">{pct}%</div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tint,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: string;
  sub?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-gradient-to-br p-3", tint)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 font-display text-2xl font-semibold tabular-nums">
        {value}
      </div>
      {sub ? <div className="text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function ActivityRow({ a }: { a: ActivityRecord }) {
  const Icon = ACTIVITY_ICON[a.activityType] ?? GraduationCap;
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-surface/60 px-3 py-2 text-sm transition-colors hover:bg-muted/40">
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {ACTIVITY_LABELS[a.activityType] ?? a.activityType}
            {a.skill ? (
              <span className="ml-1 text-muted-foreground">
                · {SKILL_LABELS[a.skill] ?? a.skill}
              </span>
            ) : null}
            {typeof a.correct === "number" && typeof a.total === "number" ? (
              <span className="ml-1 text-muted-foreground">
                · {a.correct}/{a.total}
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-muted-foreground">{ago(a.createdAt)}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
        <Zap className="h-3 w-3" /> +{a.xp}
      </div>
    </div>
  );
}

function formatDayShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { weekday: "short" });
}

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн назад`;
}
