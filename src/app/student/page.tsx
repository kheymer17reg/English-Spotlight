"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Flame,
  Gamepad2,
  GraduationCap,
  MessagesSquare,
  Mic2,
  Sparkles,
  Target,
  Trophy,
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

export default function StudentHomePage() {
  const router = useRouter();
  const student = useStore((s) => s.student);

  useEffect(() => {
    if (student === null) router.replace("/");
  }, [student, router]);

  const modules = useMemo(() => (student ? modulesByGrade(student.grade) : []), [student]);
  if (!student) return null;
  const currentModule = modules.find((m) => m.number === student.currentModule) ?? modules[0];
  const levelXp = student.xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - levelXp;
  const pct = Math.round((levelXp / XP_PER_LEVEL) * 100);

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
            <CardTitle>Задания дня</CardTitle>
            <CardDescription>6 коротких челленджей для разогрева</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              "10 слов в карточках",
              "Короткий чат с Lumos",
              "Упражнение на грамматику",
              "Текст A2 для чтения",
              "5 вопросов в квизе",
              "Повторить ошибки",
            ].map((c, i) => {
              const done = i < 2;
              return (
                <div
                  key={c}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    done
                      ? "border-emerald-500/25 bg-emerald-500/5"
                      : "border-border bg-surface hover:bg-muted/40",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "grid h-6 w-6 flex-none place-items-center rounded-full text-[10px] font-bold",
                        done
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={done ? "line-through decoration-emerald-500/50" : ""}>{c}</span>
                  </span>
                  {done ? (
                    <Badge variant="success" className="h-5 text-[10px]">
                      сделано
                    </Badge>
                  ) : (
                    <Link
                      href="/student/challenges"
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              );
            })}
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
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 text-primary transition-colors group-hover:from-primary group-hover:to-accent group-hover:text-primary-foreground">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
