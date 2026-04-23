"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { useStore } from "@/lib/store";
import { READINGS } from "@/lib/readings";
import { DIALOGUES } from "@/lib/dialogues";
import type { Homework } from "@/lib/db";
import { cn } from "@/lib/utils";
import { logActivity } from "@/lib/activity-client";

type HomeworkRow = Homework & {
  completions: { homeworkId: string; studentId: string; completedAt: string }[];
};

export default function StudentHomeworkPage() {
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const [rows, setRows] = useState<HomeworkRow[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      const [listRes, doneRes] = await Promise.all([
        fetch(`/api/homework?grade=${student.grade}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/homework/completions?studentId=${encodeURIComponent(student.id)}`, {
          cache: "no-store",
        }).then((r) => r.json()),
      ]);
      setRows(listRes.items || []);
      setDoneIds(new Set((doneRes.completions || []).map((c: { homeworkId: string }) => c.homeworkId)));
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const sorted = useMemo(() => {
    return rows.slice().sort((a, b) => {
      const adone = doneIds.has(a.id) ? 1 : 0;
      const bdone = doneIds.has(b.id) ? 1 : 0;
      if (adone !== bdone) return adone - bdone;
      const ad = a.dueDate ?? "9999";
      const bd = b.dueDate ?? "9999";
      return ad.localeCompare(bd);
    });
  }, [rows, doneIds]);

  async function toggleDone(id: string) {
    if (!student) return;
    const currentlyDone = doneIds.has(id);
    setPending(id);
    try {
      await fetch("/api/homework/completions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          homeworkId: id,
          studentId: student.id,
          done: !currentlyDone,
        }),
      });
      setDoneIds((prev) => {
        const next = new Set(prev);
        if (currentlyDone) next.delete(id);
        else next.add(id);
        return next;
      });
      if (!currentlyDone) {
        const row = rows.find((r) => r.id === id);
        const result = await logActivity({
          studentId: student.id,
          activityType: "homework",
          xp: 8,
          skill: "reading",
          meta: { homeworkId: id, title: row?.title ?? "" },
        });
        if (result) updateStudent({ xp: result.xp, level: result.level, streak: result.streak });
      }
    } finally {
      setPending(null);
    }
  }

  if (!student) return null;

  const doneCount = sorted.filter((r) => doneIds.has(r.id)).length;
  const overdueCount = sorted.filter(
    (r) => !doneIds.has(r.id) && r.dueDate && r.dueDate < new Date().toISOString().slice(0, 10),
  ).length;
  const activeCount = sorted.length - doneCount;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Мои задания</h1>
        <p className="text-muted-foreground">
          Сделанные пушатся вниз. За каждое отмеченное «Выполнено» получаешь{" "}
          <span className="font-semibold text-primary">+8 XP</span>.
        </p>
      </div>

      {!loading && sorted.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="К выполнению"
            value={activeCount}
            tint="from-primary/10 to-accent/5"
            icon={<ClipboardList className="h-4 w-4 text-primary" />}
          />
          <StatTile
            label="Сдано"
            value={doneCount}
            tint="from-emerald-500/10 to-teal-500/5"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          />
          <StatTile
            label="Просрочено"
            value={overdueCount}
            tint={
              overdueCount > 0
                ? "from-rose-500/10 to-orange-500/5"
                : "from-muted to-muted"
            }
            icon={
              <AlertCircle
                className={cn(
                  "h-4 w-4",
                  overdueCount > 0 ? "text-rose-500" : "text-muted-foreground",
                )}
              />
            }
          />
        </div>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="grid place-items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Пока нет заданий"
          description="Как только учитель создаст задание для твоего класса — оно появится здесь."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((row) => {
            const done = doneIds.has(row.id);
            const resourceLink = buildResourceLink(row);
            const resourceTitle = buildResourceTitle(row);
            const overdue = Boolean(
              row.dueDate && !done && row.dueDate < new Date().toISOString().slice(0, 10),
            );
            const isPending = pending === row.id;
            return (
              <Card
                key={row.id}
                className={cn(
                  "overflow-hidden transition-all",
                  done
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : overdue
                      ? "border-rose-500/30"
                      : "hover:border-primary/20 hover:shadow-soft",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl",
                          done
                            ? "bg-emerald-500/15 text-emerald-500"
                            : overdue
                              ? "bg-rose-500/15 text-rose-500"
                              : "bg-primary/10 text-primary",
                        )}
                      >
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle
                          className={cn(
                            "text-base",
                            done && "text-muted-foreground line-through",
                          )}
                        >
                          {row.title}
                        </CardTitle>
                        {resourceTitle ? (
                          <CardDescription>{resourceTitle}</CardDescription>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {row.dueDate ? (
                        <Badge
                          variant={overdue ? "destructive" : done ? "success" : "outline"}
                          className="gap-1 text-[10px]"
                        >
                          <Clock className="h-3 w-3" />
                          {overdue ? "просрочено" : "до"} {row.dueDate}
                        </Badge>
                      ) : null}
                      {done ? (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> Сдано
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {row.instructions ? (
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                      {row.instructions}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {resourceLink ? (
                      <Link
                        href={resourceLink}
                        className="group inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium transition-all hover:border-primary/30 hover:bg-muted"
                      >
                        Открыть
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ) : null}
                    <Button
                      size="sm"
                      onClick={() => toggleDone(row.id)}
                      disabled={isPending}
                      variant={done ? "ghost" : "primary"}
                      className="gap-1"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : done ? (
                        <>
                          <Circle className="h-4 w-4" /> Отменить
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> Отметить выполненным
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  tint,
  icon,
}: {
  label: string;
  value: number;
  tint: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-gradient-to-br p-3",
        tint,
      )}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 font-display text-2xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function buildResourceLink(row: HomeworkRow): string | null {
  if (row.resourceType === "reading" && row.resourceId) return `/student/reading?id=${row.resourceId}`;
  if (row.resourceType === "dialogue" && row.resourceId) return `/student/dialogues?id=${row.resourceId}`;
  if (row.resourceType === "exercise" && row.resourceId && /^https?:\/\//i.test(row.resourceId)) {
    return row.resourceId;
  }
  return null;
}

function buildResourceTitle(row: HomeworkRow): string | null {
  if (row.resourceType === "reading") {
    const r = READINGS.find((x) => x.id === row.resourceId);
    return r ? `Чтение · ${r.title}` : "Чтение";
  }
  if (row.resourceType === "dialogue") {
    const d = DIALOGUES.find((x) => x.id === row.resourceId);
    return d ? `Диалог · ${d.title}` : "Диалог";
  }
  if (row.resourceType === "exercise") return row.resourceId ? `Упражнение: ${row.resourceId}` : "Упражнение";
  if (row.resourceType === "text") return null;
  return null;
}
