"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Flame, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";

const DAILY = [
  { id: "d1", title: "Выучи 10 слов", xp: 20, target: "/student/vocabulary" },
  { id: "d2", title: "5 минут с Lumos", xp: 25, target: "/student/chat" },
  { id: "d3", title: "Одно упражнение на грамматику", xp: 20, target: "/student/practice" },
  { id: "d4", title: "Прочти короткий текст", xp: 20, target: "/student/reading" },
  { id: "d5", title: "Квиз по словам — 5 правильных", xp: 15, target: "/student/vocabulary" },
  { id: "d6", title: "Повтори предыдущий модуль", xp: 30, target: "/student/practice" },
];

const WEEKLY = [
  { id: "w1", title: "Занимайся 5 дней подряд", target: 5, label: "дней" },
  { id: "w2", title: "Набрать 200 XP за неделю", target: 200, label: "XP" },
  { id: "w3", title: "Освоить 40 новых слов", target: 40, label: "слов" },
];

export default function ChallengesPage() {
  const student = useStore((s) => s.student);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const completedXp = useMemo(
    () => DAILY.reduce((acc, d) => acc + (done[d.id] ? d.xp : 0), 0),
    [done],
  );

  if (!student) return null;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Задания дня</h1>
        <p className="text-muted-foreground">Короткие активности, которые держат стрик и прокачивают уровень</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Ежедневные челленджи</CardTitle>
                <CardDescription>Сделай хотя бы 3 из 6, чтобы увеличить стрик</CardDescription>
              </div>
              <Badge variant="warning" className="gap-1"><Flame className="h-3 w-3" /> {student.streak} дней</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {DAILY.map((d) => {
              const isDone = !!done[d.id];
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-3">
                    <button
                      aria-label="Отметить выполненным"
                      onClick={() => setDone((s) => ({ ...s, [d.id]: !s[d.id] }))}
                      className={`grid h-8 w-8 place-items-center rounded-full border ${
                        isDone ? "border-success bg-success text-success-foreground" : "border-border"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : null}
                    </button>
                    <div>
                      <div className="text-sm font-medium">{d.title}</div>
                      <div className="text-xs text-muted-foreground">+{d.xp} XP</div>
                    </div>
                  </div>
                  <Link href={d.target} className="text-xs text-muted-foreground hover:text-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Прогресс дня</CardTitle>
            <CardDescription>Соберись к вечеру — бонус +50 XP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Выполнено</span>
                <span className="font-medium">{Object.values(done).filter(Boolean).length} / 6</span>
              </div>
              <Progress value={(Object.values(done).filter(Boolean).length / 6) * 100} />
            </div>
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium"><Sparkles className="h-4 w-4 text-primary" /> Бонус дня</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Заработал {completedXp} XP — ещё чуть-чуть до +50 XP и прокачки уровня.
              </p>
              <Button size="sm" className="mt-3 w-full gap-2">
                <Target className="h-3.5 w-3.5" /> Забрать бонус
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Недельные цели</CardTitle>
          <CardDescription>Отслеживай прогресс за 7 дней</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {WEEKLY.map((w) => {
            const val = Math.min(w.target, Math.round(w.target * Math.random() * 0.8 + w.target * 0.1));
            return (
              <div key={w.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="text-sm font-medium">{w.title}</div>
                <div className="mt-2 flex items-end justify-between text-sm">
                  <span className="text-muted-foreground">{val} / {w.target} {w.label}</span>
                </div>
                <Progress value={(val / w.target) * 100} className="mt-1.5" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
