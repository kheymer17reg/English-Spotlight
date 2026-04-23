"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, Medal, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import type { LeagueResponse } from "@/types";
import { cn } from "@/lib/utils";

export default function LeaguePage() {
  const router = useRouter();
  const student = useStore((s) => s.student);
  const [data, setData] = useState<LeagueResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student === null) router.replace("/");
  }, [student, router]);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    fetch(`/api/student/league?studentId=${student.id}`)
      .then((r) => r.json())
      .then((j: LeagueResponse) => setData(j))
      .finally(() => setLoading(false));
  }, [student]);

  if (!student) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">Лига недели</h1>
        <p className="text-muted-foreground">
          Занимай место в топе. Рейтинг по XP за эту неделю, обновляется в понедельник.
        </p>
      </div>

      {loading || !data ? (
        <Card>
          <CardContent className="grid place-items-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>
                  {data.scope === "class"
                    ? `Класс: ${data.groupName ?? "—"}`
                    : "Школьная лига"}
                </CardTitle>
                <CardDescription>
                  Неделя {formatRange(data.weekStart, data.weekEnd)}
                </CardDescription>
              </div>
              <Badge variant="primary" className="gap-1">
                <Trophy className="h-3 w-3" /> Топ {data.top.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.top.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Пока никто не набрал XP на этой неделе. Сделай упражнение — и ты первый!
              </div>
            ) : (
              data.top.map((e) => (
                <div
                  key={e.studentId}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                    e.isMe
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-surface",
                  )}
                >
                  <div className="w-8 shrink-0 text-center">
                    {e.rank === 1 ? (
                      <Crown className="mx-auto h-5 w-5 text-amber-500" />
                    ) : e.rank === 2 ? (
                      <Medal className="mx-auto h-5 w-5 text-slate-400" />
                    ) : e.rank === 3 ? (
                      <Medal className="mx-auto h-5 w-5 text-orange-400" />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">{e.rank}</span>
                    )}
                  </div>
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-white">
                    {e.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {e.name} {e.isMe ? <span className="text-xs text-primary">(ты)</span> : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Уровень {e.level} · {e.badgesCount} бейджей
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    {e.xpThisWeek} XP
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {data?.me && !data.top.some((t) => t.isMe) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Твоё место</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2.5">
              <div className="w-8 shrink-0 text-center text-sm font-semibold text-muted-foreground">
                {data.me.rank}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {data.me.name} <span className="text-xs text-primary">(ты)</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Уровень {data.me.level} · {data.me.badgesCount} бейджей
                </div>
              </div>
              <div className="text-sm font-semibold tabular-nums">{data.me.xpThisWeek} XP</div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function formatRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  e.setUTCDate(e.getUTCDate() - 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  return `${fmt(s)} – ${fmt(e)}`;
}
