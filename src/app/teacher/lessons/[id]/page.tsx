"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Printer, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LessonView } from "@/components/lessons/lesson-view";
import { TextbookRefs } from "@/components/textbook/textbook-refs";
import type { MethodicalLesson } from "@/types";

export default function TeacherLessonDetail({ params }: { params: { id: string } }) {
  const [lesson, setLesson] = useState<MethodicalLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/lessons/${params.id}`, { cache: "no-store" });
      if (!r.ok) {
        setError("Урок не найден");
        return;
      }
      const data = (await r.json()) as { lesson: MethodicalLesson };
      setLesson(data.lesson);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function regenerate() {
    if (!lesson) return;
    if (lesson.status !== "stub" && !confirm("Перегенерировать урок? Все ручные правки будут потеряны.")) return;
    setRegenerating(true);
    try {
      const r = await fetch("/api/lessons/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: lesson.id }),
      });
      if (!r.ok) {
        const data = (await r.json()) as { error?: string };
        setError(data.error ?? "Ошибка генерации");
        return;
      }
      const data = (await r.json()) as { lesson: MethodicalLesson };
      setLesson(data.lesson);
    } finally {
      setRegenerating(false);
    }
  }

  async function download() {
    if (!lesson) return;
    setDownloading(true);
    try {
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
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
        </div>
      </div>
    );
  }
  if (error || !lesson) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="p-5 text-sm text-destructive">{error ?? "Не найдено"}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/teacher/lessons">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> К библиотеке
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={lesson.status === "stub" ? "outline" : lesson.status === "edited" ? "accent" : "success"}>
            {lesson.status === "stub" ? "Каркас" : lesson.status === "edited" ? "Отредактировано" : "Сгенерировано"}
          </Badge>
          <Button size="sm" variant="outline" onClick={regenerate} disabled={regenerating} className="gap-1">
            {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {lesson.status === "stub" ? "Сгенерировать" : "Перегенерировать"}
          </Button>
          <Link href={`/teacher/lessons/${lesson.id}/print`} target="_blank">
            <Button size="sm" variant="outline" className="gap-1">
              <Printer className="h-3 w-3" /> Печать / PDF
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={download} disabled={downloading} className="gap-1">
            {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            DOCX
          </Button>
        </div>
      </div>

      <TextbookRefs grade={lesson.grade} moduleNumber={lesson.moduleNumber} />

      {lesson.status === "stub" ? (
        <Card>
          <CardHeader>
            <CardTitle>Каркас урока</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-5 pt-0 text-sm">
            <p className="text-muted-foreground">
              Для этого урока ещё не сгенерирована технологическая карта. Нажми «Сгенерировать» — AI-методист составит полную разработку по ФГОС (~15-30 сек).
            </p>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div><b>{lesson.grade} класс, модуль {lesson.moduleNumber} «{lesson.moduleTitle}»</b></div>
              <div className="text-muted-foreground">{lesson.title}</div>
              <div className="text-muted-foreground">{lesson.lessonType} · {lesson.duration} мин · {lesson.textbookPages}</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <LessonView lesson={lesson} />
      )}
    </div>
  );
}
