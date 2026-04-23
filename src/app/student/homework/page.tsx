"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, ClipboardList, Loader2 } from "lucide-react";
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

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">Мои задания</h1>
        <p className="text-muted-foreground">
          Сделанные пушатся вниз. За каждое отмеченное «Выполнено» получаешь +8 XP.
        </p>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Пока нет заданий"
          description="Как только учитель создаст задание для твоего класса — оно появится здесь."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((row) => {
            const done = doneIds.has(row.id);
            const resourceLink = buildResourceLink(row);
            const resourceTitle = buildResourceTitle(row);
            const overdue =
              row.dueDate && !done && row.dueDate < new Date().toISOString().slice(0, 10);
            return (
              <Card
                key={row.id}
                className={cn("transition-all", done && "opacity-60")}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className={cn("flex items-center gap-2 text-base", done && "line-through")}>
                        <ClipboardList className="h-4 w-4 text-primary" />
                        {row.title}
                      </CardTitle>
                      {resourceTitle ? (
                        <CardDescription>{resourceTitle}</CardDescription>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {row.dueDate ? (
                        <Badge variant={overdue ? "destructive" : "primary"} className="text-[10px]">
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
                    <div className="rounded-lg bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                      {row.instructions}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {resourceLink ? (
                      <Link
                        href={resourceLink}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-muted"
                      >
                        Открыть <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : null}
                    <Button
                      size="sm"
                      onClick={() => toggleDone(row.id)}
                      disabled={pending === row.id}
                      variant={done ? "ghost" : "primary"}
                      className="gap-1"
                    >
                      {done ? (
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
