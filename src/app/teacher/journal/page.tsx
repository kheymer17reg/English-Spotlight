"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarPlus, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { GRADES } from "@/lib/curriculum";
import type { Attendance, JournalEntry, JournalLesson } from "@/lib/db";
import type { StudentRecord } from "@/types";

const ATTENDANCE_LABEL: Record<Attendance, { short: string; title: string; tone: string }> = {
  present: { short: "•", title: "Присутствует", tone: "text-success" },
  late: { short: "О", title: "Опоздал", tone: "text-warning" },
  excused: { short: "У", title: "Ув. причина", tone: "text-accent" },
  absent: { short: "Н", title: "Отсутствовал", tone: "text-destructive" },
};

const ATTENDANCE_ORDER: Attendance[] = ["present", "late", "excused", "absent"];

type Cell = { entry?: JournalEntry; student: StudentRecord; lesson: JournalLesson };

export default function TeacherJournalPage() {
  const [grade, setGrade] = useState<number>(5);
  const [lessons, setLessons] = useState<JournalLesson[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [popover, setPopover] = useState<{ lessonId: string; studentId: string; rect: { top: number; left: number; width: number } } | null>(null);
  const [popComment, setPopComment] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [profRes, entriesRes] = await Promise.all([
        fetch(`/api/profile?grade=${grade}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/journal/entries?grade=${grade}`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      setStudents(profRes.students || []);
      setLessons(entriesRes.lessons || []);
      setEntries(entriesRes.entries || []);
    } catch (err) {
      console.error("journal reload failed", err);
    } finally {
      setLoading(false);
    }
  }, [grade]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const entryMap = useMemo(() => {
    const m = new Map<string, JournalEntry>();
    for (const e of entries) m.set(`${e.lessonId}|${e.studentId}`, e);
    return m;
  }, [entries]);

  async function saveEntry(cell: Cell, patch: Partial<JournalEntry>) {
    const current = cell.entry ?? {
      id: "",
      lessonId: cell.lesson.id,
      studentId: cell.student.id,
      mark: null,
      attendance: "present" as Attendance,
      comment: null,
      updatedAt: new Date().toISOString(),
    };
    const next = { ...current, ...patch };
    const res = await fetch("/api/journal/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    const d = (await res.json()) as { entry: JournalEntry };
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.lessonId === next.lessonId && e.studentId === next.studentId);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = d.entry;
        return copy;
      }
      return [...prev, d.entry];
    });
  }

  async function createLesson() {
    if (!newTopic.trim() || !newDate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/journal/lessons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grade, topic: newTopic.trim(), date: newDate, module: 1 }),
      });
      const d = (await res.json()) as { lesson: JournalLesson };
      setLessons((prev) => [...prev, d.lesson].sort((a, b) => a.date.localeCompare(b.date)));
      setNewTopic("");
    } finally {
      setCreating(false);
    }
  }

  async function removeLesson(id: string) {
    if (!confirm("Удалить урок и все оценки за него?")) return;
    await fetch(`/api/journal/lessons?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setLessons((prev) => prev.filter((l) => l.id !== id));
    setEntries((prev) => prev.filter((e) => e.lessonId !== id));
  }

  function exportCsv() {
    const header = ["Ученик", ...lessons.map((l) => `${l.date} ${l.topic}`), "Средняя"];
    const rows = students.map((s) => {
      const marks = lessons.map((l) => {
        const e = entryMap.get(`${l.id}|${s.id}`);
        if (!e) return "";
        if (e.attendance === "absent") return "Н";
        return e.mark ?? "";
      });
      const numeric = marks.map((m) => Number(m)).filter((n) => Number.isFinite(n) && n > 0);
      const avg = numeric.length ? (numeric.reduce((a, b) => a + b, 0) / numeric.length).toFixed(2) : "";
      return [s.name, ...marks, avg];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-grade-${grade}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Электронный журнал</h1>
          <p className="text-muted-foreground">Оценки 2-5, посещаемость, комментарии — по классам и урокам</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="w-36">
            {GRADES.map((g) => <option key={g} value={g}>{g} класс</option>)}
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-primary" /> Новый урок
          </CardTitle>
          <CardDescription>Создаст колонку во всех строках учеников {grade} класса</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-40"
            />
            <Input
              placeholder="Тема урока (например: School Days · SB стр.18-19)"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="min-w-[280px] flex-1"
            />
            <Button onClick={createLesson} loading={creating} className="gap-2">
              <Plus className="h-4 w-4" /> Добавить
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Сетка журнала</CardTitle>
              <CardDescription>
                Кликай по ячейке, чтобы поставить оценку / «Н» / комментарий
              </CardDescription>
            </div>
            <Legend />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка…
            </div>
          ) : students.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              В {grade} классе ещё нет учеников. Онбординг ученика добавит его сюда автоматически.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="sticky left-0 z-10 bg-muted/80 px-4 py-2 backdrop-blur">
                      Ученик
                    </th>
                    {lessons.map((l) => (
                      <th key={l.id} className="min-w-[120px] px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs text-muted-foreground">{l.date}</div>
                            <div className="line-clamp-2 text-xs font-medium">{l.topic}</div>
                          </div>
                          <button
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Удалить урок"
                            onClick={() => removeLesson(l.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="w-[92px] px-3 py-2 text-right">Средняя</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const marks = lessons.map((l) => entryMap.get(`${l.id}|${s.id}`));
                    const nums = marks
                      .filter((e) => e?.attendance !== "absent")
                      .map((e) => Number(e?.mark))
                      .filter((n) => Number.isFinite(n) && n > 0);
                    const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
                    return (
                      <tr key={s.id} className="border-b border-border hover:bg-muted/30">
                        <td className="sticky left-0 z-10 border-r border-border bg-surface px-4 py-2 font-medium">
                          {s.name}
                        </td>
                        {lessons.map((l) => {
                          const e = entryMap.get(`${l.id}|${s.id}`);
                          const cell: Cell = { entry: e, student: s, lesson: l };
                          const open =
                            popover?.lessonId === l.id && popover?.studentId === s.id;
                          return (
                            <td key={l.id} className="relative px-2 py-1 text-center">
                              <button
                                className="group relative inline-flex h-9 w-16 items-center justify-center rounded-md border border-dashed border-border bg-background hover:border-primary/60"
                                onClick={(ev) => {
                                  const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                                  setPopover({
                                    lessonId: l.id,
                                    studentId: s.id,
                                    rect: { top: r.bottom + 8, left: r.left + r.width / 2, width: r.width },
                                  });
                                  setPopComment(e?.comment ?? "");
                                }}
                              >
                                <MarkDisplay entry={e} />
                                {e?.comment ? (
                                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />
                                ) : null}
                              </button>
                              {open && popover ? (
                                <CellPopover
                                  cell={cell}
                                  rect={popover.rect}
                                  commentDraft={popComment}
                                  onCommentChange={setPopComment}
                                  onSave={async (patch) => {
                                    await saveEntry(cell, patch);
                                    setPopover(null);
                                  }}
                                  onClose={() => setPopover(null)}
                                />
                              ) : null}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right font-mono">
                          {avg !== null ? (
                            <Badge variant={avg >= 4.5 ? "success" : avg >= 3.5 ? "primary" : "warning"}>
                              {avg.toFixed(2)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MarkDisplay({ entry }: { entry?: JournalEntry }) {
  if (!entry) return <span className="text-muted-foreground">·</span>;
  if (entry.attendance === "absent") {
    return <span className="font-semibold text-destructive">Н</span>;
  }
  if (entry.mark) {
    const color =
      entry.mark === "5" ? "text-success"
      : entry.mark === "4" ? "text-primary"
      : entry.mark === "3" ? "text-warning"
      : "text-destructive";
    const att = ATTENDANCE_LABEL[entry.attendance];
    return (
      <span className="flex items-center gap-1">
        <span className={`font-semibold ${color}`}>{entry.mark}</span>
        {entry.attendance !== "present" ? (
          <span className={`text-[10px] ${att.tone}`}>{att.short}</span>
        ) : null}
      </span>
    );
  }
  const att = ATTENDANCE_LABEL[entry.attendance];
  return <span className={att.tone}>{att.short}</span>;
}

function CellPopover({
  cell,
  rect,
  commentDraft,
  onCommentChange,
  onSave,
  onClose,
}: {
  cell: Cell;
  rect: { top: number; left: number; width: number };
  commentDraft: string;
  onCommentChange: (v: string) => void;
  onSave: (patch: Partial<JournalEntry>) => Promise<void>;
  onClose: () => void;
}) {
  const current = cell.entry;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(
    <>
      <button
        className="fixed inset-0 z-[70] bg-transparent"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        style={{ position: "fixed", top: rect.top, left: rect.left, transform: "translateX(-50%)" }}
        className="z-[80] w-64 rounded-xl border border-border bg-surface p-3 text-left shadow-xl"
      >
        <div className="mb-2 text-xs text-muted-foreground">
          {cell.student.name} · {cell.lesson.date}
        </div>
        <div className="mb-2 text-xs font-medium">Оценка</div>
        <div className="mb-3 flex items-center gap-1">
          {["2", "3", "4", "5"].map((m) => (
            <button
              key={m}
              className={`h-9 flex-1 rounded-md border text-sm font-semibold transition-colors ${
                current?.mark === m
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/60"
              }`}
              onClick={() => onSave({ mark: m, attendance: current?.attendance ?? "present", comment: commentDraft || null })}
            >
              {m}
            </button>
          ))}
          <button
            className="h-9 rounded-md border border-border px-2 text-xs hover:bg-muted"
            onClick={() => onSave({ mark: null, attendance: current?.attendance ?? "present", comment: commentDraft || null })}
          >
            стереть
          </button>
        </div>
        <div className="mb-2 text-xs font-medium">Посещаемость</div>
        <div className="mb-3 grid grid-cols-4 gap-1">
          {ATTENDANCE_ORDER.map((a) => (
            <button
              key={a}
              className={`rounded-md border py-1.5 text-xs ${
                current?.attendance === a
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/60"
              }`}
              onClick={() =>
                onSave({
                  attendance: a,
                  mark: a === "absent" ? null : current?.mark ?? null,
                  comment: commentDraft || null,
                })
              }
            >
              <span className={ATTENDANCE_LABEL[a].tone}>{ATTENDANCE_LABEL[a].short}</span>
              <div className="text-[10px] text-muted-foreground">{ATTENDANCE_LABEL[a].title}</div>
            </button>
          ))}
        </div>
        <div className="mb-2 text-xs font-medium">Комментарий</div>
        <textarea
          value={commentDraft}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-background p-2 text-xs focus:border-primary focus:outline-none"
          placeholder="например: Активная работа у доски"
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Отмена</Button>
          <Button
            size="sm"
            onClick={() =>
              onSave({
                mark: current?.mark ?? null,
                attendance: current?.attendance ?? "present",
                comment: commentDraft || null,
              })
            }
          >
            Сохранить
          </Button>
        </div>
      </div>
    </>,
    document.body,
  );
}

function Legend() {
  return (
    <div className="hidden items-center gap-3 text-[10px] text-muted-foreground md:flex">
      {ATTENDANCE_ORDER.map((a) => (
        <span key={a} className="inline-flex items-center gap-1">
          <span className={`font-semibold ${ATTENDANCE_LABEL[a].tone}`}>{ATTENDANCE_LABEL[a].short}</span>
          {ATTENDANCE_LABEL[a].title}
        </span>
      ))}
    </div>
  );
}
