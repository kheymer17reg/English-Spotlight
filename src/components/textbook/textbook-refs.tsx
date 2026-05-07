"use client";

/**
 * Compact card that surfaces references into the official Spotlight PDFs for
 * a given (grade, module). Lives next to lesson plans and exercise generators
 * so the teacher always has one click to "open student book at p. 26" when
 * preparing a lesson, without leaving the app.
 *
 * Buttons are hidden when the corresponding PDF isn't physically present on
 * the teacher's machine — the availability check is done by
 * `/api/textbook/availability`.
 */
import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, NotebookPen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Grade } from "@/types";
import { moduleRefs, pdfDeepLink } from "@/lib/textbook";

interface AvailabilityFile {
  url: string;
  label: string;
  short: string;
  exists: boolean;
}

interface AvailabilityResponse {
  grade: Grade;
  files: Partial<Record<"studentBookPart1" | "studentBookPart2" | "workbook" | "teacherBook", AvailabilityFile>>;
}

export function TextbookRefs({
  grade,
  moduleNumber,
  variant = "card",
}: {
  grade: Grade;
  moduleNumber: number;
  variant?: "card" | "inline";
}) {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/textbook/availability?grade=${grade}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()) as AvailabilityResponse;
      })
      .then((r) => {
        if (!cancelled) {
          setData(r);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [grade]);

  const refs = moduleRefs(grade, moduleNumber);
  if (!refs || !loaded) return null;
  if (!data) return null;

  // Pick the SB part — module's `studentBook.book` says "part1" or "part2".
  const sbKey = refs.studentBook?.book === "part2" ? "studentBookPart2" : "studentBookPart1";
  const sbFile = data.files[sbKey];
  const wbFile = data.files.workbook;
  const tbFile = data.files.teacherBook;

  const sbLink = sbFile?.exists ? pdfDeepLink(sbFile, refs.studentBook?.from) : null;
  const wbLink = wbFile?.exists ? pdfDeepLink(wbFile, refs.workbook?.from) : null;
  const tbLink = tbFile?.exists ? pdfDeepLink(tbFile) : null;

  const hasAnyFile = !!(sbFile?.exists || wbFile?.exists);
  if (!hasAnyFile) {
    // Quiet placeholder so the teacher knows the integration exists once they
    // drop their PDFs into public/textbooks/grade-N/.
    if (variant === "inline") return null;
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> Учебник Spotlight {grade} не найден.
        </div>
        <div className="mt-1">
          Положи PDF учебника и тетради в{" "}
          <code className="rounded bg-background px-1 py-0.5">public/textbooks/grade-{grade}/</code>{" "}
          (см. README в папке) — здесь появятся кнопки «открыть на стр. {refs.studentBook?.from ?? "—"}».
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {sbLink && refs.studentBook ? (
          <a
            href={sbLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 font-medium text-primary hover:bg-primary/10"
          >
            <BookOpen className="h-3 w-3" />
            Учебник стр. {refs.studentBook.from}–{refs.studentBook.to}
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        ) : null}
        {wbLink && refs.workbook ? (
          <a
            href={wbLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/5 px-2.5 py-1 font-medium text-accent-foreground hover:bg-accent/10"
          >
            <NotebookPen className="h-3 w-3" />
            Тетрадь стр. {refs.workbook.from}–{refs.workbook.to}
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 via-surface to-accent/5 p-4 print:hidden">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <BookOpen className="h-4 w-4 text-primary" />
        Spotlight {grade} · Модуль {moduleNumber}
        <Badge variant="outline" className="text-[10px]">УМК</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {sbLink && refs.studentBook ? (
          <a
            href={sbLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          >
            <BookOpen className="h-4 w-4" />
            <span>
              Учебник стр. <b>{refs.studentBook.from}–{refs.studentBook.to}</b>
            </span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        ) : null}
        {wbLink && refs.workbook ? (
          <a
            href={wbLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/15"
          >
            <NotebookPen className="h-4 w-4" />
            <span>
              Тетрадь стр. <b>{refs.workbook.from}–{refs.workbook.to}</b>
            </span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        ) : null}
        {tbLink ? (
          <a
            href={tbLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            Книга для учителя
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        ) : null}
      </div>
      {refs.workbookExercises && refs.workbookExercises.length > 0 && wbFile?.exists ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            Опорные упражнения тетради ({refs.workbookExercises.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {refs.workbookExercises.map((ex) => (
              <li key={`${ex.page}-${ex.exercise}`} className="flex items-center gap-2">
                <a
                  href={pdfDeepLink(wbFile, ex.page) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[11px] hover:border-primary/40 hover:bg-primary/5"
                >
                  стр. {ex.page} · упр. {ex.exercise}
                </a>
                <span className="text-muted-foreground">{ex.topic}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
