"use client";

import { useMemo } from "react";
import { Award, BookOpen, GraduationCap, LineChart, Medal, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";

const SKILLS = [
  { key: "grammar", label: "Грамматика" },
  { key: "vocabulary", label: "Словарь" },
  { key: "reading", label: "Чтение" },
  { key: "listening", label: "Аудирование" },
] as const;

function seededPct(key: string, base = 45) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return Math.max(20, Math.min(95, base + (h % 45)));
}

export default function ProgressPage() {
  const student = useStore((s) => s.student);
  const skills = useMemo(
    () =>
      SKILLS.map((s) => ({
        ...s,
        pct: seededPct(student ? `${student.id}-${s.key}` : s.key, 55),
      })),
    [student],
  );
  if (!student) return null;

  const badges = [
    { id: "first-chat", label: "Первый диалог с Lumos", unlocked: true, icon: GraduationCap },
    { id: "10-words", label: "10 новых слов", unlocked: true, icon: BookOpen },
    { id: "streak-3", label: "Стрик 3 дня", unlocked: student.streak >= 3, icon: Medal },
    { id: "streak-7", label: "Стрик 7 дней", unlocked: student.streak >= 7, icon: Trophy },
    { id: "xp-500", label: "500 XP", unlocked: student.xp >= 500, icon: Award },
    { id: "level-5", label: "Уровень 5", unlocked: student.level >= 5, icon: Trophy },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Прогресс</h1>
        <p className="text-muted-foreground">Что уже освоено и что прокачать</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Уровень" value={student.level} sub={`${student.xp % 200}/200 до следующего`} />
        <StatCard title="XP" value={student.xp} sub="всего опыта" />
        <StatCard title="Стрик" value={student.streak} sub="дней подряд" />
        <StatCard title="Модуль" value={student.currentModule} sub="текущий" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Навыки</CardTitle>
              <CardDescription>Средняя точность по категориям</CardDescription>
            </div>
            <Badge variant="primary" className="gap-1"><LineChart className="h-3 w-3" /> За 30 дней</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {skills.map((s) => (
            <div key={s.key}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground">{s.pct}%</span>
              </div>
              <Progress value={s.pct} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Бейджи</CardTitle>
          <CardDescription>Достижения за старания</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl border p-4 ${
                b.unlocked ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30 opacity-60"
              }`}
            >
              <div className={`mb-2 grid h-9 w-9 place-items-center rounded-lg ${b.unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                <b.icon className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium">{b.label}</div>
              <div className="text-xs text-muted-foreground">{b.unlocked ? "Открыто" : "Заблокировано"}</div>
            </div>
          ))}
        </CardContent>
      </Card>
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
