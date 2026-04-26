"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Crown,
  Flame,
  Medal,
  Moon,
  Rocket,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { ParentLinkCard } from "@/components/parent/parent-link-card";
import { StreakCalendar } from "@/components/streak/streak-calendar";
import { cn } from "@/lib/utils";
import type { Grade, StudentProgressReport, UnlockedBadge } from "@/types";

const XP_PER_LEVEL = 200;

const BADGE_ICONS: Record<UnlockedBadge["icon"], typeof Star> = {
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

function profileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const reset = useStore((s) => s.reset);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  const [name, setName] = useState(student?.name ?? "");
  const [grade, setGrade] = useState<Grade>(student?.grade ?? 5);
  const [report, setReport] = useState<StudentProgressReport | null>(null);

  useEffect(() => {
    if (!student?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/student/progress?studentId=${encodeURIComponent(student.id)}`, {
          cache: "no-store",
        });
        if (!r.ok) return;
        const data = (await r.json()) as StudentProgressReport;
        if (!cancelled) setReport(data);
      } catch {
        // soft-fail; hero falls back to store data
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [student?.id]);

  if (!student) return null;

  const xp = report?.student.xp ?? student.xp;
  const level = report?.student.level ?? student.level;
  const streak = report?.student.streak ?? student.streak;
  const xpThisWeek = report?.student.xpThisWeek ?? 0;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;
  const levelProgress = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

  const unlocked = report?.badges.unlocked ?? [];
  const locked = report?.badges.locked ?? [];
  const recentBadges = [...unlocked]
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Hero */}
      <Card className="overflow-hidden border-primary/20">
        <div className="relative bg-gradient-to-br from-primary/15 via-surface to-accent/15 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-full bg-gradient-to-tr from-primary via-accent to-primary p-[3px]">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-surface font-display text-2xl font-bold">
                {profileInitials(student.name)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="font-display text-2xl font-semibold">{student.name}</h1>
                <Badge variant="outline" className="text-xs">{student.grade} класс</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Уровень {level}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 font-semibold text-orange-600 dark:text-orange-400">
                  <Flame className="h-3.5 w-3.5" /> {streak} {streak === 1 ? "день" : "дней"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <Zap className="h-3.5 w-3.5" /> +{xpThisWeek} XP за неделю
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">{xp}</span> XP всего
              </span>
              <span>До уровня {level + 1}: {xpToNext} XP</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      <StreakCalendar />

      {/* Recent badges */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-500" /> Достижения
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {unlocked.length} / {unlocked.length + locked.length}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {recentBadges.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
              Ачивки появятся, как только начнёшь заниматься. Сделай 5 упражнений или выучи 10 слов — это первые.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {recentBadges.map((b) => {
                const Icon = BADGE_ICONS[b.icon] ?? Star;
                return (
                  <div
                    key={b.id}
                    className="flex flex-col items-center gap-1 rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-2 text-center"
                    title={b.description}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="line-clamp-2 text-[11px] font-medium leading-tight">{b.title}</div>
                  </div>
                );
              })}
            </div>
          )}
          {locked.length > 0 ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Закрытые ачивки ({locked.length})
              </summary>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {locked.map((b) => {
                  const Icon = BADGE_ICONS[b.icon] ?? Star;
                  return (
                    <div
                      key={b.id}
                      className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border bg-muted/20 p-2 text-center opacity-70"
                      title={b.description}
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">
                        {b.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          ) : null}
        </CardContent>
      </Card>

      {/* Skills snapshot */}
      {report && report.skills.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Точность по навыкам</CardTitle>
            <CardDescription>За всё время</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {report.skills.map((s) => (
                <div key={s.skill} className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium capitalize">{s.skill}</span>
                    <span className="text-muted-foreground">
                      <span className={cn(
                        "font-semibold",
                        s.accuracy >= 0.8 ? "text-emerald-600 dark:text-emerald-400"
                          : s.accuracy >= 0.5 ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400",
                      )}>
                        {Math.round(s.accuracy * 100)}%
                      </span>{" "}· {s.attempts} попыт.
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full transition-all",
                        s.accuracy >= 0.8 ? "bg-emerald-500"
                          : s.accuracy >= 0.5 ? "bg-amber-500"
                          : "bg-rose-500",
                      )}
                      style={{ width: `${Math.round(s.accuracy * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Данные ученика</CardTitle>
          <CardDescription>Используются для подбора программы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Имя</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Класс</label>
            <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>
              {[2, 3, 4, 5, 6, 7, 8].map((g) => (
                <option key={g} value={g}>{g} класс</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end pt-1">
            <Button onClick={() => updateStudent({ name, grade })}>Сохранить</Button>
          </div>
        </CardContent>
      </Card>

      <ParentLinkCard />

      <Card>
        <CardHeader>
          <CardTitle>Тема оформления</CardTitle>
          <CardDescription>Светлая или тёмная</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="inline-flex rounded-lg border border-border p-1">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${theme === "light" ? "bg-surface shadow-soft" : "text-muted-foreground"}`}
            >
              <Sun className="h-3.5 w-3.5" /> Светлая
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${theme === "dark" ? "bg-surface shadow-soft" : "text-muted-foreground"}`}
            >
              <Moon className="h-3.5 w-3.5" /> Тёмная
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Сброс</CardTitle>
          <CardDescription>Удалить данные и выйти из кабинета</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              reset();
              router.push("/");
            }}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Сбросить профиль
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
