"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Flame,
  Gamepad2,
  GraduationCap,
  Headphones,
  MessagesSquare,
  Mic2,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { modulesByGrade } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

const XP_PER_LEVEL = 200;

type DailyKey = "vocab" | "practice" | "reading" | "pair" | "pronunciation";

type TodayResponse = {
  pendingHomework: {
    id: string;
    title: string;
    dueDate: string | null;
    resourceType: string;
  }[];
  done: Record<DailyKey, boolean>;
  todayXp: number;
};

type DailyTask = {
  key: DailyKey;
  href: string;
  icon: LucideIcon;
  title: string;
  hint: string;
};

const DAILY_TASKS: DailyTask[] = [
  { key: "vocab", href: "/student/vocabulary", icon: BookOpen, title: "5 слов", hint: "Карточки словаря" },
  { key: "practice", href: "/student/practice", icon: GraduationCap, title: "Упражнение", hint: "Тренировка дня" },
  { key: "reading", href: "/student/reading", icon: Headphones, title: "Текст", hint: "Чтение по уровню" },
  { key: "pair", href: "/student/pair", icon: Users, title: "Диалог", hint: "Парный роль-плей" },
  { key: "pronunciation", href: "/student/pronunciation", icon: Mic2, title: "Голос", hint: "Произношение слова" },
];

export default function StudentHomePage() {
  const router = useRouter();
  const student = useStore((s) => s.student);
  const bootstrapped = useStore((s) => s.bootstrapped);
  const [today, setToday] = useState<TodayResponse | null>(null);

  useEffect(() => {
    if (bootstrapped && student === null) router.replace("/");
  }, [student, bootstrapped, router]);

  useEffect(() => {
    if (!student) return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/student/today", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as TodayResponse;
        if (!cancelled) setToday(data);
      } catch {
        // soft-fail; widget shows defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [student]);

  const modules = useMemo(() => (student ? modulesByGrade(student.grade) : []), [student]);
  if (!student) return null;
  const currentModule = modules.find((m) => m.number === student.currentModule) ?? modules[0];
  const levelXp = student.xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - levelXp;
  const pct = Math.round((levelXp / XP_PER_LEVEL) * 100);

  const doneCount = today
    ? DAILY_TASKS.reduce((acc, t) => acc + (today.done[t.key] ? 1 : 0), 0)
    : 0;
  const dailyPct = Math.round((doneCount / DAILY_TASKS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <Badge variant="primary" className="mb-3">
              {student.grade} класс · Модуль {currentModule?.number}
            </Badge>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              Привет, <span className="gradient-text">{student.name}</span>!
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Сегодня продолжаем <strong>{currentModule?.title}</strong>. До следующего
              уровня осталось <span className="font-semibold text-primary">{xpToNext} XP</span>.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link href="/student/chat">
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" /> Спросить Lumos
                </Button>
              </Link>
              <Link href="/student/practice">
                <Button size="lg" variant="outline" className="gap-2">
                  <GraduationCap className="h-4 w-4" /> Тренировка дня
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid w-full grid-cols-3 gap-3 text-sm lg:w-[340px]">
            <HeroTile
              icon={<Flame className="h-4 w-4 text-orange-500 flame-pulse" />}
              label="Стрик"
              value={`${student.streak} д.`}
              tint="from-orange-500/15 to-amber-500/5"
            />
            <HeroTile
              icon={<Zap className="h-4 w-4 text-primary" />}
              label="XP"
              value={student.xp.toString()}
              tint="from-primary/15 to-accent/5"
            />
            <HeroTile
              icon={<Trophy className="h-4 w-4 text-accent" />}
              label="Уровень"
              value={student.level.toString()}
              tint="from-accent/15 to-primary/5"
            />
          </div>
        </div>
      </div>

      {/* Сегодня — основной операционный блок */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Сегодня к выполнению
              </CardTitle>
              <CardDescription>
                {today
                  ? doneCount === DAILY_TASKS.length
                    ? "Все цели дня выполнены — можно переходить к челленджам."
                    : `Сделано ${doneCount} из ${DAILY_TASKS.length}. ${today.todayXp} XP за сегодня.`
                  : "Загружаю прогресс…"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden h-2.5 w-40 overflow-hidden rounded-full bg-muted sm:block">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">{dailyPct}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {DAILY_TASKS.map((task) => {
              const isDone = today?.done[task.key] ?? false;
              const Icon = task.icon;
              return (
                <Link
                  key={task.key}
                  href={task.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-soft",
                    isDone
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border bg-surface hover:border-primary/30",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 flex-none place-items-center rounded-lg",
                      isDone ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{task.title}</div>
                    <div className="text-xs text-muted-foreground">{task.hint}</div>
                  </div>
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 flex-none transition-transform group-hover:translate-x-0.5",
                      isDone ? "text-emerald-600/70" : "text-muted-foreground",
                    )}
                  />
                </Link>
              );
            })}
          </div>

          {/* Pending homework — only render if there is anything */}
          {today && today.pendingHomework.length > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <ClipboardList className="h-4 w-4" /> Несданные задания ({today.pendingHomework.length})
              </div>
              <ul className="space-y-1.5">
                {today.pendingHomework.map((hw) => (
                  <li key={hw.id}>
                    <Link
                      href="/student/homework"
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-amber-500/10"
                    >
                      <span className="truncate font-medium">{hw.title}</span>
                      {hw.dueDate ? (
                        <span className="flex-none text-xs text-muted-foreground">
                          до {new Date(hw.dueDate).toLocaleDateString("ru-RU")}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Текущий модуль</CardTitle>
                <CardDescription>
                  {currentModule
                    ? `«${currentModule.title}» — ${currentModule.topics.join(", ")}`
                    : "—"}
                </CardDescription>
              </div>
              <Badge variant="primary">
                <Target className="mr-1 h-3 w-3" /> В фокусе
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Прогресс уровня</span>
                <span className="font-semibold tabular-nums text-primary">
                  {levelXp} / {XP_PER_LEVEL}
                </span>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Грамматика
                </span>
                <span className="text-right font-medium">
                  {currentModule?.grammar.join(" · ")}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Лексика
                </span>
                <span className="text-right font-medium">
                  {currentModule?.vocabulary.slice(0, 4).join(", ")}
                  {(currentModule?.vocabulary.length ?? 0) > 4 ? "…" : ""}
                </span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <QuickLink href="/student/practice" icon={GraduationCap} title="Упражнения" />
              <QuickLink href="/student/vocabulary" icon={BookOpen} title="Словарь" />
              <QuickLink href="/student/reading" icon={MessagesSquare} title="Чтение" />
              <QuickLink href="/student/pronunciation" icon={Mic2} title="Лингафон" />
              <QuickLink href="/student/games" icon={Gamepad2} title="Игры" />
              <QuickLink href="/student/league" icon={Trophy} title="Лига" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Челленджи и достижения</CardTitle>
            <CardDescription>Где ты сейчас в общем рейтинге</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/student/league"
              className="flex items-center justify-between rounded-xl border border-border bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-3 transition-colors hover:border-amber-500/30"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/15 text-amber-600">
                  <Trophy className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">Лига класса</div>
                  <div className="text-xs text-muted-foreground">XP за неделю</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/student/challenges"
              className="flex items-center justify-between rounded-xl border border-border bg-gradient-to-br from-fuchsia-500/10 to-pink-500/5 p-3 transition-colors hover:border-fuchsia-500/30"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-fuchsia-500/15 text-fuchsia-600">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">Челленджи</div>
                  <div className="text-xs text-muted-foreground">Длинные цели и бейджи</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/student/feed"
              className="flex items-center justify-between rounded-xl border border-border bg-gradient-to-br from-sky-500/10 to-blue-500/5 p-3 transition-colors hover:border-sky-500/30"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/15 text-sky-600">
                  <Zap className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">Лента класса</div>
                  <div className="text-xs text-muted-foreground">Что делают одноклассники</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HeroTile({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-gradient-to-br p-3", tint)}>
      <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-surface/80">
        {icon}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted hover:shadow-soft"
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
