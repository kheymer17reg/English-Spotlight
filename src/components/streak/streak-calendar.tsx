"use client";

/**
 * GitHub-style activity heatmap. 53 weeks × 7 days, intensity by daily XP.
 * Pulls from /api/student/heatmap. Shows current + best streak inline.
 */
import { useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HeatmapResponse {
  days: number;
  from: string;
  activity: Record<string, { xp: number; n: number }>;
  streak: number;
  bestStreak: number;
}

const MONTHS_RU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
const WEEKDAYS_RU = ["Пн", "", "Ср", "", "Пт", "", "Вс"];

function tone(xp: number): string {
  if (xp <= 0) return "bg-muted/40";
  if (xp < 10) return "bg-emerald-500/25";
  if (xp < 25) return "bg-emerald-500/45";
  if (xp < 60) return "bg-emerald-500/70";
  return "bg-emerald-500";
}

export function StreakCalendar({ studentId, days = 365 }: { studentId?: string; days?: number }) {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ days: String(days) });
    if (studentId) params.set("studentId", studentId);
    fetch(`/api/student/heatmap?${params.toString()}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as HeatmapResponse;
      })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [studentId, days]);

  const grid = useMemo(() => {
    if (!data) return null;
    // Build a list of days from `from` → today, then arrange into week columns
    // (Monday-first), padding the leading days of the first column to match
    // the weekday of `from`.
    const start = new Date(data.from + "T00:00:00Z");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const cells: { date: string; xp: number; n: number; month: number; weekday: number }[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const key = cursor.toISOString().slice(0, 10);
      const a = data.activity[key];
      // JS Sunday=0..Saturday=6 → Monday-first index 0..6
      const js = cursor.getUTCDay();
      const weekday = (js + 6) % 7;
      cells.push({
        date: key,
        xp: a?.xp ?? 0,
        n: a?.n ?? 0,
        month: cursor.getUTCMonth(),
        weekday,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    if (cells.length === 0) return null;
    // Pad start so column 0 starts on Monday.
    const lead = cells[0].weekday;
    const padded: ({ date: string; xp: number; n: number; month: number; weekday: number } | null)[] = [];
    for (let i = 0; i < lead; i += 1) padded.push(null);
    padded.push(...cells);

    const cols: ((typeof cells)[number] | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));
    while (cols[cols.length - 1].length < 7) cols[cols.length - 1].push(null);
    return cols;
  }, [data]);

  const monthLabels = useMemo(() => {
    if (!grid) return [] as { col: number; label: string }[];
    const out: { col: number; label: string }[] = [];
    let lastMonth = -1;
    grid.forEach((week, idx) => {
      const first = week.find((c) => c !== null);
      if (!first) return;
      if (first.month !== lastMonth) {
        out.push({ col: idx, label: MONTHS_RU[first.month] });
        lastMonth = first.month;
      }
    });
    return out;
  }, [grid]);

  if (error && !data) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }
  if (!data || !grid) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Загружаем активность…</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-display text-lg font-semibold">Календарь активности</div>
            <div className="text-xs text-muted-foreground">
              Год по дням. Чем зеленее — тем больше XP за день.
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2 py-1 text-amber-700 dark:text-amber-300">
              <Flame className="h-4 w-4" /> {data.streak} дн стрик
            </div>
            <div className="text-xs text-muted-foreground">рекорд {data.bestStreak}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-flex gap-3 pb-2 align-top">
            <div className="flex flex-col gap-[3px] pt-4 text-[9px] text-muted-foreground">
              {WEEKDAYS_RU.map((w, i) => (
                <div key={i} className="h-[10px] leading-[10px]">{w}</div>
              ))}
            </div>
            <div>
              <div className="relative h-3 mb-1">
                {monthLabels.map((m) => (
                  <span
                    key={m.col}
                    className="absolute text-[10px] text-muted-foreground"
                    style={{ left: m.col * 13 }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
              <div className="flex gap-[3px]">
                {grid.map((week, ci) => (
                  <div key={ci} className="flex flex-col gap-[3px]">
                    {week.map((c, ri) =>
                      c === null ? (
                        <div key={ri} className="h-[10px] w-[10px] rounded-sm bg-transparent" />
                      ) : (
                        <div
                          key={ri}
                          className={cn(
                            "h-[10px] w-[10px] rounded-sm transition-transform hover:scale-125",
                            tone(c.xp),
                          )}
                          title={`${c.date}: ${c.xp} XP, ${c.n} активн.`}
                        />
                      ),
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                Меньше
                <span className={cn("h-[10px] w-[10px] rounded-sm", tone(0))} />
                <span className={cn("h-[10px] w-[10px] rounded-sm", tone(5))} />
                <span className={cn("h-[10px] w-[10px] rounded-sm", tone(15))} />
                <span className={cn("h-[10px] w-[10px] rounded-sm", tone(45))} />
                <span className={cn("h-[10px] w-[10px] rounded-sm", tone(80))} />
                Больше
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
