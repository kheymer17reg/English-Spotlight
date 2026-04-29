"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, Medal, Sparkles, Trophy } from "lucide-react";
import { FunNavStrip } from "@/components/student/fun-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import type { LeagueEntry, LeagueResponse } from "@/types";
import { cn } from "@/lib/utils";

export default function LeaguePage() {
  const router = useRouter();
  const student = useStore((s) => s.student);
  const bootstrapped = useStore((s) => s.bootstrapped);
  const [data, setData] = useState<LeagueResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bootstrapped && student === null) router.replace("/");
  }, [student, bootstrapped, router]);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    fetch(`/api/student/league?studentId=${student.id}`)
      .then((r) => r.json())
      .then((j: LeagueResponse) => setData(j))
      .finally(() => setLoading(false));
  }, [student]);

  if (!student) return null;

  const podium = data?.top.slice(0, 3) ?? [];
  const rest = data?.top.slice(3) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FunNavStrip current="league" icon={<Trophy className="h-5 w-5" />} title="Лига недели" subtitle="Рейтинг по XP за эту неделю — сброс в понедельник." />

      {loading || !data ? (
        <Card>
          <CardContent className="grid place-items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-surface to-accent/10">
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
            <CardContent className="pb-8 pt-2">
              {podium.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Пока никто не набрал XP на этой неделе. Сделай упражнение — и ты первый!
                </div>
              ) : (
                <Podium podium={podium} />
              )}
            </CardContent>
          </Card>

          {rest.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Остальные места</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rest.map((e) => (
                  <LeagueRow key={e.studentId} e={e} />
                ))}
              </CardContent>
            </Card>
          ) : null}

          {data.me && !data.top.some((t) => t.isMe) ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Твоё место</CardTitle>
              </CardHeader>
              <CardContent>
                <LeagueRow e={data.me} />
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

function Podium({ podium }: { podium: LeagueEntry[] }) {
  // Layout: 2nd | 1st (center taller) | 3rd
  const first = podium[0];
  const second = podium[1];
  const third = podium[2];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
        <PodiumSlot entry={second} rank={2} heightClass="h-40" />
        <PodiumSlot entry={first} rank={1} heightClass="h-52" featured />
        <PodiumSlot entry={third} rank={3} heightClass="h-32" />
      </div>
    </div>
  );
}

function PodiumSlot({
  entry,
  rank,
  heightClass,
  featured,
}: {
  entry: LeagueEntry | undefined;
  rank: 1 | 2 | 3;
  heightClass: string;
  featured?: boolean;
}) {
  if (!entry) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="h-10 w-10" />
        <div
          className={cn(
            "flex w-full items-center justify-center rounded-t-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground",
            heightClass,
          )}
        >
          —
        </div>
      </div>
    );
  }

  const tone =
    rank === 1
      ? { bg: "bg-gradient-to-br from-amber-400 to-amber-600", border: "border-amber-500/50", glow: "glow-amber", icon: Crown, iconColor: "text-amber-500" }
      : rank === 2
        ? { bg: "bg-gradient-to-br from-slate-300 to-slate-500", border: "border-slate-400/50", glow: "glow-silver", icon: Medal, iconColor: "text-slate-400" }
        : { bg: "bg-gradient-to-br from-orange-400 to-orange-700", border: "border-orange-500/50", glow: "glow-bronze", icon: Medal, iconColor: "text-orange-500" };
  const Icon = tone.icon;

  return (
    <div className="flex flex-col items-center gap-2">
      <Icon className={cn("h-7 w-7", tone.iconColor)} />
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white",
          tone.bg,
          featured ? "ring-4 ring-amber-200/60" : "",
        )}
      >
        {entry.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="w-full text-center">
        <div
          className={cn(
            "truncate text-sm font-semibold",
            entry.isMe ? "text-primary" : "",
          )}
        >
          {entry.name}
          {entry.isMe ? " (ты)" : ""}
        </div>
        <div className="text-[11px] text-muted-foreground">
          уровень {entry.level}
        </div>
      </div>
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-t-xl border px-2 py-2 text-center transition-all",
          tone.border,
          tone.glow,
          featured
            ? "bg-gradient-to-t from-amber-50 to-white text-amber-900 dark:from-amber-950/40 dark:to-amber-900/10 dark:text-amber-100"
            : rank === 2
              ? "bg-gradient-to-t from-slate-50 to-white text-slate-700 dark:from-slate-900/40 dark:to-slate-900/10 dark:text-slate-100"
              : "bg-gradient-to-t from-orange-50 to-white text-orange-900 dark:from-orange-950/40 dark:to-orange-900/10 dark:text-orange-100",
          heightClass,
        )}
      >
        <div className="font-display text-3xl font-bold tabular-nums leading-none">
          {entry.xpThisWeek}
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-widest opacity-80">
          XP
        </div>
        <div className="mt-auto pb-1 text-xs font-bold">
          #{rank}
        </div>
      </div>
    </div>
  );
}

function LeagueRow({ e }: { e: LeagueEntry }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        e.isMe
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-surface hover:bg-muted/40",
      )}
    >
      <div className="w-8 shrink-0 text-center text-sm font-semibold text-muted-foreground">
        {e.rank}
      </div>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-white">
        {e.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {e.name}
          {e.isMe ? <span className="ml-1 text-xs text-primary">(ты)</span> : null}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          Уровень {e.level}
          {e.badgesCount > 0 ? (
            <>
              <span>·</span>
              <Sparkles className="h-3 w-3" /> {e.badgesCount}
            </>
          ) : null}
        </div>
      </div>
      <div className="text-sm font-semibold tabular-nums">{e.xpThisWeek} XP</div>
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
