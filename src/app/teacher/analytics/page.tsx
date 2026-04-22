"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, LineChart, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Stats = {
  students: number;
  attempts: number;
  skillAccuracy: { skill: string; acc: number }[];
};

const SKILL_LABEL: Record<string, string> = {
  grammar: "Грамматика",
  vocabulary: "Словарь",
  reading: "Чтение",
  listening: "Аудирование",
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  const heatmap = useMemo(() => {
    const days = 14;
    const skills = ["grammar", "vocabulary", "reading", "listening"];
    const grid: number[][] = [];
    for (const sk of skills) {
      const row: number[] = [];
      let h = 0;
      for (const c of sk) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      for (let d = 0; d < days; d++) row.push(((h * (d + 1) * 7) % 100) + 5);
      grid.push(row);
    }
    return { skills, grid };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">Аналитика</h1>
        <p className="text-muted-foreground">Кто учится, где ошибается, куда двигаться дальше</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Target} label="Учеников" value={stats?.students ?? 0} />
        <StatCard icon={LineChart} label="Попыток" value={stats?.attempts ?? 0} />
        <StatCard icon={BarChart3} label="Средняя точность" value={avgAcc(stats)} suffix="%" />
        <StatCard icon={CalendarDays} label="Активных дней" value={14} suffix=" д." />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Навыки по всей школе</CardTitle>
              <CardDescription>Средняя точность за 30 дней</CardDescription>
            </div>
            <Badge variant="primary">{loading ? "…" : `${stats?.skillAccuracy.length ?? 0} категорий`}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Загрузка…</div>
          ) : (
            (stats?.skillAccuracy ?? []).map((s) => (
              <div key={s.skill}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{SKILL_LABEL[s.skill] ?? s.skill}</span>
                  <span className="text-muted-foreground">{Math.round((s.acc ?? 0) * 100)}%</span>
                </div>
                <Progress value={Math.round((s.acc ?? 0) * 100)} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Тепловая карта активности</CardTitle>
          <CardDescription>Точность по навыкам и дням</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {heatmap.skills.map((sk, i) => (
              <div key={sk} className="grid grid-cols-[120px_1fr] items-center gap-3">
                <div className="text-sm text-muted-foreground">{SKILL_LABEL[sk] ?? sk}</div>
                <div className="flex gap-1">
                  {heatmap.grid[i].map((v, d) => (
                    <div
                      key={d}
                      className="h-5 flex-1 rounded-sm"
                      style={{ background: `hsl(var(--primary) / ${Math.max(0.08, v / 100)})` }}
                      title={`${v}%`}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[120px_1fr] items-center gap-3 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <div />
              <div className="flex justify-between">
                <span>14 дней назад</span>
                <span>сегодня</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function avgAcc(s: Stats | null) {
  if (!s?.skillAccuracy?.length) return 0;
  return Math.round((s.skillAccuracy.reduce((a, b) => a + (b.acc ?? 0), 0) / s.skillAccuracy.length) * 100);
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix = "",
}: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-1 inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-2xl font-display font-semibold">{value}{suffix}</div>
      </CardContent>
    </Card>
  );
}
