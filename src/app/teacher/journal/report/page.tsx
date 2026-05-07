"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { JournalEntry, JournalLesson } from "@/lib/db";
import type { StudentRecord } from "@/types";

export default function JournalReportPageOuter() {
  return (
    <Suspense fallback={null}>
      <JournalReportPage />
    </Suspense>
  );
}

const ATT_SHORT: Record<string, string> = { present: "·", late: "О", excused: "У", absent: "Н" };

function average(marks: (string | null)[]): string {
  const nums = marks
    .map((m) => (m == null ? NaN : parseInt(m, 10)))
    .filter((n) => !Number.isNaN(n) && n >= 2 && n <= 5);
  if (!nums.length) return "—";
  const avg = nums.reduce((s, x) => s + x, 0) / nums.length;
  return avg.toFixed(2);
}

function JournalReportPage() {
  const params = useSearchParams();
  const grade = Number(params.get("grade") || "5");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [lessons, setLessons] = useState<JournalLesson[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [profRes, journalRes] = await Promise.all([
        fetch(`/api/profile?grade=${grade}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/journal/entries?grade=${grade}`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      setStudents(profRes.students || []);
      setLessons(journalRes.lessons || []);
      setEntries(journalRes.entries || []);
    } finally {
      setLoading(false);
    }
  }, [grade]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Set document title so browser's "Save as PDF" uses a nice filename.
  useEffect(() => {
    document.title = `journal-${grade}kl-${today}`;
  }, [grade, today]);

  const entryMap = useMemo(() => {
    const m = new Map<string, JournalEntry>();
    for (const e of entries) m.set(`${e.lessonId}|${e.studentId}`, e);
    return m;
  }, [entries]);

  const rows = useMemo(() => {
    return students.map((s) => {
      const cells = lessons.map((l) => entryMap.get(`${l.id}|${s.id}`));
      return {
        student: s,
        cells,
        avg: average(cells.map((c) => c?.mark ?? null)),
        attendance: countAttendance(cells),
      };
    });
  }, [students, lessons, entryMap]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Загрузка отчёта…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 p-6 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href="/teacher/journal"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> К журналу
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-110"
        >
          <Printer className="h-4 w-4" /> Печать / Сохранить PDF
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 print:rounded-none print:border-0 print:bg-white">
        <header className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Spotlight Learning · Отчёт по классу
            </div>
            <h1 className="mt-1 font-display text-2xl font-semibold">
              Журнал {grade} класса
            </h1>
            <div className="text-sm text-muted-foreground">
              Дата отчёта: {today} · Учеников: {students.length} · Уроков: {lessons.length}
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Подпись учителя:
            <div className="mt-3 h-8 w-40 border-b border-foreground" />
          </div>
        </header>

        {students.length === 0 ? (
          <div className="text-sm text-muted-foreground">Нет учеников в этом классе.</div>
        ) : lessons.length === 0 ? (
          <div className="text-sm text-muted-foreground">Уроков пока не было.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-border bg-muted/40 p-2 text-left align-bottom text-xs">
                    Ученик
                  </th>
                  {lessons.map((l) => (
                    <th
                      key={l.id}
                      className="border border-border bg-muted/40 p-1 align-bottom text-[10px] font-medium"
                      style={{ minWidth: 40 }}
                    >
                      <div>{l.date}</div>
                      <div className="line-clamp-2 text-[9px] font-normal text-muted-foreground">
                        {l.topic}
                      </div>
                    </th>
                  ))}
                  <th className="border border-border bg-muted/40 p-2 text-center text-xs">Ср</th>
                  <th className="border border-border bg-muted/40 p-2 text-center text-xs">Пропуски</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.student.id}>
                    <td className="border border-border p-2 font-medium">{r.student.name}</td>
                    {r.cells.map((c, i) => (
                      <td
                        key={i}
                        className="border border-border p-1 text-center text-sm tabular-nums"
                      >
                        {c?.mark ? (
                          <span className={markClass(c.mark)}>{c.mark}</span>
                        ) : c?.attendance && c.attendance !== "present" ? (
                          <span className="text-muted-foreground">
                            {ATT_SHORT[c.attendance] ?? "·"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    ))}
                    <td className="border border-border p-2 text-center font-semibold tabular-nums">
                      {r.avg}
                    </td>
                    <td className="border border-border p-2 text-center text-xs tabular-nums">
                      {r.attendance.absent + r.attendance.late > 0
                        ? `${r.attendance.absent}Н · ${r.attendance.late}О`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
          <span>«Н» — отсутствует</span>
          <span>«О» — опоздал</span>
          <span>«У» — уважительная причина</span>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body { background: white !important; }
          aside, nav, header[data-mobile], .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function countAttendance(cells: (JournalEntry | undefined)[]) {
  let present = 0, late = 0, absent = 0, excused = 0;
  for (const c of cells) {
    const a = c?.attendance ?? (c ? "present" : null);
    if (a === "present") present += 1;
    else if (a === "late") late += 1;
    else if (a === "absent") absent += 1;
    else if (a === "excused") excused += 1;
  }
  return { present, late, absent, excused };
}

function markClass(mark: string): string {
  if (mark === "5") return "font-bold text-success";
  if (mark === "4") return "font-semibold text-primary";
  if (mark === "3") return "text-warning";
  if (mark === "2") return "text-destructive";
  return "";
}
