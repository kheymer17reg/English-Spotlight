"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface StoryListItem {
  id: string;
  title: string;
  titleRu: string;
  emoji: string;
  grade: number;
  durationMin: number;
  summary: string;
  sceneCount: number;
  progress: { sceneIndex: number; correct: number; total: number; finishedAt: string | null } | null;
}

export default function StoriesIndex() {
  const student = useStore((s) => s.student);
  const [grade, setGrade] = useState<number>(student?.grade ?? 5);
  const [items, setItems] = useState<StoryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stories?grade=${grade}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<{ stories: StoryListItem[] }>)
      .then((b) => setItems(b.stories ?? []))
      .finally(() => setLoading(false));
  }, [grade]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-5 shadow-soft">
        <div className="flex flex-wrap items-start gap-3">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold leading-tight">Сюжетки</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Короткие истории на английском с мини-вопросами после каждой сцены. 3–6 минут на одну.
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Класс</label>
            <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value))}>
              {[2, 3, 4, 5, 6, 7, 8].map((g) => (
                <option key={g} value={String(g)}>{g} класс</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="p-5 text-sm text-muted-foreground">Загружаем…</CardContent></Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Для этого класса пока нет историй. Попробуй соседний.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((s) => {
            const prog = s.progress;
            const done = prog?.finishedAt !== undefined && prog?.finishedAt !== null;
            const accuracy = prog && prog.total > 0 ? Math.round((prog.correct / prog.total) * 100) : null;
            return (
              <Link
                key={s.id}
                href={`/student/stories/${s.id}`}
                className={cn(
                  "group rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                  done && "border-emerald-500/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-2xl">
                    {s.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <div className="font-display font-semibold leading-tight">{s.title}</div>
                      {done ? (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <Trophy className="h-3 w-3" /> {accuracy}%
                        </Badge>
                      ) : prog ? (
                        <Badge variant="default" className="text-[10px]">
                          {prog.sceneIndex}/{s.sceneCount}
                        </Badge>
                      ) : (
                        <Badge variant="primary" className="gap-1 text-[10px]">
                          <Sparkles className="h-3 w-3" /> новое
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.titleRu}</div>
                    <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{s.summary}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {s.durationMin} мин
                      <span>•</span>
                      <span>{s.sceneCount} сцен</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
