"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { GRADES } from "@/lib/curriculum";
import { READINGS } from "@/lib/readings";
import { DIALOGUES } from "@/lib/dialogues";
import type { Homework } from "@/lib/db";

type HomeworkRow = Homework & {
  completions: { homeworkId: string; studentId: string; completedAt: string }[];
};

export default function TeacherHomeworkPage() {
  const [grade, setGrade] = useState<number>(5);
  const [rows, setRows] = useState<HomeworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<Homework["resourceType"]>("reading");
  const [resourceId, setResourceId] = useState<string>("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/homework?grade=${grade}`, { cache: "no-store" });
      const data = await res.json();
      setRows(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [grade]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const readingOptions = useMemo(() => READINGS.filter((r) => r.grade === grade), [grade]);
  const dialogueOptions = useMemo(() => DIALOGUES.filter((d) => d.grade === grade), [grade]);

  // Keep resourceId valid whenever the source list changes.
  useEffect(() => {
    if (resourceType === "reading") {
      if (!readingOptions.find((r) => r.id === resourceId)) {
        setResourceId(readingOptions[0]?.id ?? "");
      }
    } else if (resourceType === "dialogue") {
      if (!dialogueOptions.find((d) => d.id === resourceId)) {
        setResourceId(dialogueOptions[0]?.id ?? "");
      }
    } else {
      setResourceId("");
    }
  }, [resourceType, readingOptions, dialogueOptions, resourceId]);

  async function createHomework() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/homework", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grade,
          title: title.trim(),
          instructions: instructions.trim() || null,
          resourceType,
          resourceId: resourceId || null,
          dueDate: dueDate || null,
        }),
      });
      setTitle("");
      setInstructions("");
      await reload();
    } finally {
      setCreating(false);
    }
  }

  async function removeHomework(id: string) {
    if (!confirm("Удалить задание?")) return;
    await fetch(`/api/homework?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Домашние задания</h1>
          <p className="text-muted-foreground">
            Назначай классу чтение, диалог или произвольный текст. У ученика задание появится на странице
            «Мои задания» с напоминанием и кнопкой «Выполнено».
          </p>
        </div>
        <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value))}>
          {GRADES.map((g) => (
            <option key={g} value={g}>{g} класс</option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Новое задание</CardTitle>
          <CardDescription>Для {grade} класса</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Название задания (например: прочитать и пересказать)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-[180px_1fr_160px]">
            <Select value={resourceType} onChange={(e) => setResourceType(e.target.value as Homework["resourceType"])}>
              <option value="reading">Текст для чтения</option>
              <option value="dialogue">Диалог</option>
              <option value="exercise">Упражнение (ссылка)</option>
              <option value="text">Произвольный текст</option>
            </Select>
            {resourceType === "reading" ? (
              <Select value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
                <option value="">— выбери текст —</option>
                {readingOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.title} · {r.level}</option>
                ))}
              </Select>
            ) : resourceType === "dialogue" ? (
              <Select value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
                <option value="">— выбери диалог —</option>
                {dialogueOptions.map((d) => (
                  <option key={d.id} value={d.id}>{d.title} · {d.level}</option>
                ))}
              </Select>
            ) : (
              <Input
                placeholder="ссылка или описание задания"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
              />
            )}
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            placeholder="Инструкции (необязательно): на что обратить внимание, какие слова повторить…"
            className="w-full resize-none rounded-lg border border-border bg-background p-2 text-sm focus:border-primary focus:outline-none"
          />
          <div className="flex justify-end">
            <Button onClick={createHomework} disabled={!title.trim() || creating} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Создать
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Задания {grade} класса</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Заданий пока нет. Создай первое выше.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => {
                const resourceName =
                  row.resourceType === "reading"
                    ? READINGS.find((r) => r.id === row.resourceId)?.title ?? row.resourceId
                    : row.resourceType === "dialogue"
                      ? DIALOGUES.find((d) => d.id === row.resourceId)?.title ?? row.resourceId
                      : row.resourceId;
                return (
                  <div key={row.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-sm font-medium">{row.title}</div>
                        <Badge variant="outline" className="text-[10px]">{row.resourceType}</Badge>
                        {row.dueDate ? (
                          <Badge variant="primary" className="text-[10px]">до {row.dueDate}</Badge>
                        ) : null}
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> {row.completions.length} сдали
                        </Badge>
                      </div>
                      {resourceName ? (
                        <div className="truncate text-xs text-muted-foreground">{resourceName}</div>
                      ) : null}
                      {row.instructions ? (
                        <div className="mt-1 text-xs text-foreground/80">{row.instructions}</div>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHomework(row.id)}
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
