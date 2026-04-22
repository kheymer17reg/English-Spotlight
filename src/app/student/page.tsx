"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Flame,
  GraduationCap,
  MessagesSquare,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { modulesByGrade } from "@/lib/curriculum";

export default function StudentHomePage() {
  const router = useRouter();
  const student = useStore((s) => s.student);

  useEffect(() => {
    if (student === null) router.replace("/");
  }, [student, router]);

  const modules = useMemo(() => (student ? modulesByGrade(student.grade) : []), [student]);
  if (!student) return null;
  const currentModule = modules.find((m) => m.number === student.currentModule) ?? modules[0];
  const xpToNext = 200 - (student.xp % 200);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="primary" className="mb-3">
              {student.grade} класс · Модуль {currentModule?.number}
            </Badge>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              Привет, <span className="gradient-text">{student.name}</span>!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Сегодня продолжаем <strong>{currentModule?.title}</strong>.
              До следующего уровня осталось {xpToNext} XP.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link href="/student/chat">
                <Button size="lg" className="gap-2">
                  <MessagesSquare className="h-4 w-4" /> Спросить Lumos
                </Button>
              </Link>
              <Link href="/student/practice">
                <Button size="lg" variant="outline" className="gap-2">
                  <GraduationCap className="h-4 w-4" /> Тренировка дня
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <StatTile icon={Flame} label="Стрик" value={`${student.streak} д.`} tone="warning" />
            <StatTile icon={Star} label="XP" value={student.xp.toString()} tone="primary" />
            <StatTile icon={Trophy} label="Уровень" value={student.level.toString()} tone="accent" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Текущий модуль</CardTitle>
                <CardDescription>
                  {currentModule ? `«${currentModule.title}» — ${currentModule.topics.join(", ")}` : "—"}
                </CardDescription>
              </div>
              <Badge variant="primary">
                <Target className="mr-1 h-3 w-3" /> В фокусе
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Прогресс по модулю</span>
                <span className="font-medium">{Math.min(100, (student.xp % 200) / 2)}%</span>
              </div>
              <Progress value={(student.xp % 200) / 2} />
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Грамматика</span>
                <span>{currentModule?.grammar.join(" · ")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Лексика</span>
                <span>{currentModule?.vocabulary.slice(0, 3).join(", ")}…</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <QuickLink href="/student/practice" icon={GraduationCap} title="Упражнения" />
              <QuickLink href="/student/vocabulary" icon={BookOpen} title="Словарь" />
              <QuickLink href="/student/reading" icon={MessagesSquare} title="Чтение" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Задания дня</CardTitle>
            <CardDescription>6 коротких челленджей для разогрева</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "10 слов в карточках",
              "Короткий чат с Lumos",
              "Одно упражнение на грамматику",
              "Текст A2 для чтения",
              "5 вопросов в квизе",
              "Повторить предыдущий модуль",
            ].map((c, i) => (
              <div key={c} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${i < 2 ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {i < 2 ? "✓" : i + 1}
                  </span>
                  {c}
                </span>
                {i < 2 ? (
                  <Badge variant="success" className="text-[10px]">сделано</Badge>
                ) : (
                  <Link href="/student/challenges" className="text-xs text-muted-foreground hover:text-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "primary" | "warning" | "accent" }) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    accent: "bg-accent/10 text-accent",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-surface/70 p-3">
      <div className={`mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md ${toneCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, title }: { href: string; icon: any; title: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted"
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
