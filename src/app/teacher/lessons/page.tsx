"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Circle, Download, Loader2, Printer, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { GRADES, modulesByGrade } from "@/lib/curriculum";
import type { Grade, MethodicalLesson } from "@/types";

type Stats = { total: number; generated: number; stub: number; edited: number };

export default function TeacherLessonsLibrary() {
  const [grade, setGrade] = useState<Grade>(5);
  const [lessons, setLessons] = useState<MethodicalLesson[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, generated: 0, stub: 0, edited: 0 });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const modules = useMemo(() => modulesByGrade(grade), [grade]);
  const byModule = useMemo(() => {
    const map = new Map<number, MethodicalLesson[]>();
    for (const l of lessons) {
      if (l.grade !== grade) continue;
      const arr = map.get(l.moduleNumber) ?? [];
      arr.push(l);
      map.set(l.moduleNumber, arr);
    }
    return map;
  }, [lessons, grade]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lessons", { cache: "no-store" });
      const data = (await res.json()) as { lessons: MethodicalLesson[]; stats: Stats };
      setLessons(data.lessons);
      setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function seed() {
    setSeeding(true);
    try {
      await fetch("/api/lessons", { method: "POST" });
      await reload();
    } finally {
      setSeeding(false);
    }
  }

  async function generateOne(id: string) {
    setGeneratingId(id);
    try {
      const res = await fetch("/api/lessons/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = (await res.json()) as { lesson: MethodicalLesson };
        setLessons((prev) => prev.map((l) => (l.id === id ? data.lesson : l)));
        setStats((s) => ({ ...s, generated: s.generated + 1, stub: Math.max(0, s.stub - 1) }));
      }
    } finally {
      setGeneratingId(null);
    }
  }

  const pct = stats.total > 0 ? Math.round(((stats.generated + stats.edited) / stats.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-success/10 via-surface to-accent/10 p-6">
        <Badge variant="accent" className="mb-2 gap-1">
          <Sparkles className="h-3 w-3" /> ФГОС 2022 · УМК Spotlight 2–8
        </Badge>
        <h1 className="font-display text-3xl font-semibold">Библиотека методических разработок</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          196 уроков: технологические карты, цели по ФГОС, УУД на каждом этапе, реплики учителя на английском,
          рефлексия и ДЗ. HTML-просмотр + печать/PDF + экспорт DOCX.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Готово:</span>{" "}
            <b>{stats.generated + stats.edited}</b> / {stats.total} <span className="text-muted-foreground">({pct}%)</span>
          </div>
          {stats.total === 0 ? (
            <Button onClick={seed} disabled={seeding} className="gap-2">
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Заполнить каркас 196 уроков
            </Button>
          ) : null}
          <Link href="/teacher/lessons/quick">
            <Button variant="outline" className="gap-2">
              <Wand2 className="h-4 w-4" /> Быстрый одноразовый план
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Уроки · {grade} класс</h2>
        <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g} класс
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
        </div>
      ) : stats.total === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-5 text-sm">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Пока нет ни одного урока. Нажми «Заполнить каркас», чтобы создать 196 стартовых карточек (по 7 уроков на модуль для 2–8 классов).
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((m) => {
            const items = byModule.get(m.number) ?? [];
            return (
              <Card key={m.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Модуль {m.number}</span>
                    <span>{m.title}</span>
                    <Badge variant="outline">{items.length} уроков</Badge>
                  </CardTitle>
                  <CardDescription>
                    Темы: {m.topics.join(", ")} · Грамматика: {m.grammar.join(", ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-5 pt-0">
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Каркас не построен.</div>
                  ) : (
                    items.map((l) => (
                      <LessonRow
                        key={l.id}
                        lesson={l}
                        busy={generatingId === l.id}
                        onGenerate={() => generateOne(l.id)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  busy,
  onGenerate,
}: {
  lesson: MethodicalLesson;
  busy: boolean;
  onGenerate: () => void;
}) {
  const ready = lesson.status !== "stub";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
      {ready ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          Урок {lesson.lessonNumber}. {lesson.title}
        </div>
        <div className="text-xs text-muted-foreground">
          {lesson.lessonType} · {lesson.duration} мин · {lesson.textbookPages}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {ready ? (
          <>
            <Link href={`/teacher/lessons/${lesson.id}`}>
              <Button size="sm" variant="outline" className="gap-1">
                <BookOpen className="h-3 w-3" /> Открыть
              </Button>
            </Link>
            <Link href={`/teacher/lessons/${lesson.id}/print`} target="_blank">
              <Button size="sm" variant="outline" className="gap-1">
                <Printer className="h-3 w-3" /> Печать / PDF
              </Button>
            </Link>
            <DownloadDocxButton id={lesson.id} />
          </>
        ) : (
          <Button size="sm" onClick={onGenerate} disabled={busy} className="gap-1">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Сгенерировать
          </Button>
        )}
      </div>
    </div>
  );
}

function DownloadDocxButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  async function onClick() {
    setBusy(true);
    try {
      const r = await fetch(`/api/lessons/${id}`, { cache: "no-store" });
      if (!r.ok) return;
      const { lesson } = (await r.json()) as { lesson: MethodicalLesson };
      const d = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "methodical", lesson }),
      });
      if (!d.ok) return;
      const blob = await d.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `methodical-g${lesson.grade}-m${lesson.moduleNumber}-l${lesson.lessonNumber}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={busy} className="gap-1">
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
      DOCX
    </Button>
  );
}
