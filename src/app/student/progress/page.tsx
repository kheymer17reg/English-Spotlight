"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Crown,
  Flame,
  GraduationCap,
  LineChart,
  Loader2,
  Medal,
  Rocket,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import type { BadgeDefinition, StudentProgressReport } from "@/types";
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
          <CardContent className="grid place-items-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard title="Уровень" value={report.student.level} sub={`${report.student.xp % 200}/200 до следующего`} />
            <StatCard title="XP всего" value={report.student.xp} sub={`${report.student.xpThisWeek} на этой неделе`} />
            <StatCard title="Стрик" value={report.student.streak} sub="дней подряд" />
            <StatCard title="Ошибок освоено" value={report.mistakes.mastered} sub={`в работе: ${report.mistakes.active}`} />
          </div>

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
            <CardContent className="space-y-5">
              {report.skills.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Сделай первое упражнение — появится статистика по навыкам.
                </div>
              ) : (
                report.skills.map((s) => (
                  <div key={s.skill}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">{SKILL_LABELS[s.skill] ?? s.skill}</span>
                      <span className="text-muted-foreground">
                        {s.accuracy}% <span className="text-xs">· {s.attempts} подх.</span>
                      </span>
                    </div>
                    <Progress value={s.accuracy} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>XP за последние 7 дней</CardTitle>
              <CardDescription>Ежедневный вклад в стрик</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                {report.weeklyXp.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-full rounded-t-md",
                        d.xp > 0 ? "bg-gradient-to-t from-primary to-accent" : "bg-muted",
                      )}
                      style={{ height: `${(d.xp / weeklyMax) * 100}px`, minHeight: "4px" }}
                      aria-label={`${d.day}: ${d.xp} XP`}
                    />
                    <div className="text-[10px] text-muted-foreground">{formatDayShort(d.day)}</div>
                    <div className="text-xs tabular-nums">{d.xp}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Бейджи</CardTitle>
              <CardDescription>
                Открыто {report.badges.unlocked.length} из{" "}
                {report.badges.unlocked.length + report.badges.locked.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {[...report.badges.unlocked, ...report.badges.locked].map((b) => {
                const unlocked = "unlockedAt" in b;
                const Icon = ICON_MAP[b.icon] ?? Award;
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "rounded-xl border p-4",
                      unlocked
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-muted/30 opacity-60",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-2 grid h-9 w-9 place-items-center rounded-lg",
                        unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium">{b.title}</div>
                    <div className="text-xs text-muted-foreground">{b.description}</div>
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
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {ACTIVITY_LABELS[a.activityType] ?? a.activityType}
                            {a.skill ? (
                              <span className="ml-1 text-muted-foreground">· {SKILL_LABELS[a.skill] ?? a.skill}</span>
                            ) : null}
                            {typeof a.correct === "number" && typeof a.total === "number" ? (
                              <span className="ml-1 text-muted-foreground">
                                · {a.correct}/{a.total}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">{formatAgo(a.createdAt)}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums text-primary">+{a.xp}</div>
                    </div>
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

function StatCard({ title, value, sub }: { title: string; value: number | string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
        <div className="mt-1 text-3xl font-display font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function formatDayShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { weekday: "short" });
}

function formatAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} д назад`;
}
