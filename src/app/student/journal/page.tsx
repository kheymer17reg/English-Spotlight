"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Calendar, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import type { JournalEntry, JournalLesson } from "@/lib/db";

type Row = JournalEntry & { lesson: JournalLesson };

const ATTENDANCE_LABEL: Record<string, { title: string; tone: string }> = {
  present: { title: "Присутствовал", tone: "text-success" },
  late: { title: "Опоздание", tone: "text-warning" },
  excused: { title: "Ув. причина", tone: "text-accent" },
  absent: { title: "Отсутствовал", tone: "text-destructive" },
};

export default function StudentJournalPage() {
  const student = useStore((s) => s.student);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/journal/entries?studentId=${encodeURIComponent(student.id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRows(d.entries || []))
      .catch((err) => console.error("student journal load failed", err))
      .finally(() => setLoading(false));
  }, [student]);

  const { avg, marksCount, attendanceRate } = useMemo(() => {
    const marks = rows
      .filter((r) => r.mark && r.attendance !== "absent")
      .map((r) => Number(r.mark))
      .filter((n) => Number.isFinite(n));
    const present = rows.filter((r) => r.attendance === "present" || r.attendance === "late").length;
    return {
      avg: marks.length ? marks.reduce((a, b) => a + b, 0) / marks.length : null,
      marksCount: marks.length,
      attendanceRate: rows.length ? Math.round((present / rows.length) * 100) : 0,
    };
  }, [rows]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24 lg:pb-8">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Мой журнал</h1>
        <p className="text-muted-foreground">Оценки, посещаемость и комментарии учителя</p>
      </div>

      {!student ? (
        <EmptyNeedsProfile />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Средняя" value={avg !== null ? avg.toFixed(2) : "—"} tone="primary" />
            <StatCard label="Оценок" value={String(marksCount)} tone="accent" />
            <StatCard label="Посещаемость" value={`${attendanceRate}%`} tone="success" />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> История уроков
                  </CardTitle>
                  <CardDescription>{student.name}, {student.grade} класс</CardDescription>
                </div>
                <Badge variant="primary">{rows.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Загрузка…</div>
              ) : rows.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Пока записей нет — учитель ещё не вёл журнал для вашего класса.
                </div>
              ) : (
                rows.map((r) => <LessonRow key={r.id} row={r} />)
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "primary" | "accent" | "success" }) {
  const bg = tone === "primary" ? "from-primary/15 to-primary/5" : tone === "accent" ? "from-accent/15 to-accent/5" : "from-success/15 to-success/5";
  return (
    <div className={`rounded-xl border border-border bg-gradient-to-br ${bg} p-4`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function LessonRow({ row }: { row: Row }) {
  const att = ATTENDANCE_LABEL[row.attendance] ?? ATTENDANCE_LABEL.present;
  const mark = row.attendance === "absent" ? "Н" : row.mark ?? "—";
  const markColor =
    row.attendance === "absent" ? "bg-destructive text-destructive-foreground"
    : row.mark === "5" ? "bg-success text-success-foreground"
    : row.mark === "4" ? "bg-primary text-primary-foreground"
    : row.mark === "3" ? "bg-warning text-warning-foreground"
    : row.mark === "2" ? "bg-destructive text-destructive-foreground"
    : "bg-muted text-muted-foreground";
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
      <div className={`grid h-10 w-10 place-items-center rounded-md font-display text-lg font-semibold ${markColor}`}>
        {mark}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {row.lesson.date}
          <span className={`ml-auto ${att.tone}`}>{att.title}</span>
        </div>
        <div className="mt-0.5 truncate font-medium">{row.lesson.topic}</div>
        {row.comment ? (
          <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-accent/10 px-2 py-1.5 text-xs text-accent">
            <MessageSquare className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span>{row.comment}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyNeedsProfile() {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <div className="text-sm text-muted-foreground">
          Чтобы видеть свои оценки, зайди на <a className="text-primary underline" href="/">главную</a> и выбери профиль ученика.
        </div>
      </CardContent>
    </Card>
  );
}
