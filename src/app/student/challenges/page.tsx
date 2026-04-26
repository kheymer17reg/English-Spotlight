"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Flame, Sparkles, Target } from "lucide-react";
import { FunNavStrip } from "@/components/student/fun-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

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
      <FunNavStrip current="challenges" icon={<Target className="h-5 w-5" />} title="Задания дня" subtitle="Короткие активности, которые держат стрик и прокачивают уровень." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Ежедневные челленджи</CardTitle>
                <CardDescription>
                  Сделай хотя бы 3 из 6, чтобы удержать стрик
                </CardDescription>
              </div>
              <Badge variant="warning" className="gap-1">
                <Flame className="h-3 w-3 flame-pulse" /> {student.streak} д.
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {DAILY.map((d) => {
              const isDone = !!done[d.id];
              return (
                <div
                  key={d.id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border p-3 transition-all",
                    isDone
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border bg-surface hover:border-primary/30 hover:bg-muted/40",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      aria-label="Отметить выполненным"
                      onClick={() => setDone((s) => ({ ...s, [d.id]: !s[d.id] }))}
                      className={cn(
                        "grid h-8 w-8 flex-none place-items-center rounded-full border-2 transition-all",
                        isDone
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-border hover:border-primary",
                      )}
                    >
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : null}
                    </button>
                    <div className="min-w-0">
                      <div
                        className={cn(
                          "truncate text-sm font-medium",
                          isDone && "text-muted-foreground line-through",
                        )}
                      >
                        {d.title}
                      </div>
                      <div className="text-xs text-primary">+{d.xp} XP</div>
                    </div>
                  </div>
                  <Link
                    href={d.target}
                    className="group inline-flex h-8 items-center gap-1 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
                  >
                    К заданию
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Прогресс дня</CardTitle>
            <CardDescription>Собери все 6 — бонус +50 XP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DayGauge
              value={Object.values(done).filter(Boolean).length}
              total={DAILY.length}
            />
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> Бонус дня
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Заработал <strong className="text-primary">{completedXp} XP</strong> — собери все
                и получи ещё +50 XP.
              </p>
              <Button
                size="sm"
                className="mt-3 w-full gap-2"
                disabled={Object.values(done).filter(Boolean).length < DAILY.length}
              >
                <Target className="h-3.5 w-3.5" />
                {Object.values(done).filter(Boolean).length < DAILY.length
                  ? "Доделай задания"
                  : "Забрать бонус"}
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
          {WEEKLY.map((w, i) => {
            const val = Math.min(
              w.target,
              Math.round(w.target * 0.15 + w.target * 0.6 * ((i + 1) / WEEKLY.length)),
            );
            const pct = Math.round((val / w.target) * 100);
            const done = val >= w.target;
            return (
              <div
                key={w.id}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  done
                    ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5"
                    : "border-border bg-gradient-to-br from-primary/5 via-surface to-accent/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{w.title}</div>
                  <Badge variant={done ? "success" : "outline"} className="text-[10px]">
                    {pct}%
                  </Badge>
                </div>
                <div className="mt-2 flex items-end justify-between text-xs text-muted-foreground">
                  <span>
                    <span className="font-display text-base font-semibold tabular-nums text-foreground">
                      {val}
                    </span>{" "}
                    / {w.target} {w.label}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      done
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                        : "bg-gradient-to-r from-primary to-accent",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function DayGauge({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Выполнено</span>
        <span className="font-display text-base font-semibold tabular-nums">
          {value} <span className="text-muted-foreground">/ {total}</span>
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-all",
              i < value
                ? "bg-gradient-to-r from-primary to-accent"
                : "bg-muted",
            )}
          />
        ))}
      </div>
      <div className="mt-1.5 text-right text-[11px] font-medium text-muted-foreground">
        {pct}%
      </div>
    </div>
  );
}
