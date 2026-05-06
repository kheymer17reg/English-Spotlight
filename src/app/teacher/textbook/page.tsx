"use client";

/**
 * Textbook hub for the teacher. Lists all curriculum modules of a chosen
 * grade with their official Spotlight page ranges + key workbook exercises.
 *
 * The PDFs themselves are not in the repo — the teacher must drop their
 * legitimate copy into `public/textbooks/grade-N/` (see
 * `/public/textbooks/README.md`). When a file is missing, this page renders
 * setup instructions instead of a broken link.
 */
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, Info, Loader2, NotebookPen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { GRADES, modulesByGrade } from "@/lib/curriculum";
import { moduleRefs, pdfDeepLink, textbookForGrade, type GradeTextbook } from "@/lib/textbook";
import type { Grade } from "@/types";

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

export default function TeacherTextbookPage() {
  const [grade, setGrade] = useState<Grade>(2);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const tb: GradeTextbook | null = useMemo(() => textbookForGrade(grade), [grade]);
  const modules = useMemo(() => modulesByGrade(grade), [grade]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/textbook/availability?grade=${grade}`, { cache: "no-store" })
      .then(async (r) => (await r.json()) as AvailabilityResponse)
      .then((r) => {
        if (!cancelled) {
          setAvailability(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [grade]);

  const sb1 = availability?.files.studentBookPart1;
  const sb2 = availability?.files.studentBookPart2;
  const wb = availability?.files.workbook;
  const teacherBook = availability?.files.teacherBook;

  const anyExists = !!(sb1?.exists || sb2?.exists || wb?.exists || teacherBook?.exists);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold leading-tight">Учебники Spotlight</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Карта модулей с привязкой к страницам и упражнениям официального УМК.
              Открой нужную страницу учебника или тетради в один клик.
            </p>
          </div>
          <div className="hidden md:block">
            <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g} класс
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="md:hidden">
          <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value) as Grade)} className="mt-3">
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g} класс
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Проверяю наличие PDF…
          </CardContent>
        </Card>
      ) : !tb ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Для {grade} класса карта модулей ещё не привязана. Сейчас доступен пилот — Spotlight 2.
          </CardContent>
        </Card>
      ) : !anyExists ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" /> Подключи свой PDF учебника
            </CardTitle>
            <CardDescription>
              Файлы УМК не входят в репозиторий из-за авторского права. Положи свою легально приобретённую копию
              в указанные папки — кнопки появятся автоматически.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="font-medium">Куда положить файлы</div>
              <div className="mt-1 text-muted-foreground">Создай папку и положи туда PDF под точным именем:</div>
              <pre className="mt-2 overflow-x-auto rounded-md bg-background p-2 text-xs">
public/textbooks/grade-{grade}/
{`  spotlight-${grade}-student-book-part-1.pdf
  spotlight-${grade}-student-book-part-2.pdf  (опц.)
  spotlight-${grade}-workbook.pdf
  spotlight-${grade}-teacher-book.pdf  (опц.)`}
              </pre>
              <div className="mt-2 text-xs text-muted-foreground">
                После добавления файла обнови эту страницу — кнопки откроют PDF на нужной странице.
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{grade} класс · Файлы УМК</CardTitle>
            <CardDescription>Открыть полный PDF в новой вкладке.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <FileButton file={sb1} icon={<BookOpen className="h-4 w-4" />} />
              <FileButton file={sb2} icon={<BookOpen className="h-4 w-4" />} />
              <FileButton file={wb} icon={<NotebookPen className="h-4 w-4" />} />
              <FileButton file={teacherBook} icon={<BookOpen className="h-4 w-4" />} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Модули {grade} класса</CardTitle>
          <CardDescription>
            Кликни по странице — откроется PDF на нужном развороте через встроенный просмотрщик браузера.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {modules.map((m) => {
            const refs = moduleRefs(grade, m.number);
            const sbKey = refs?.studentBook?.book === "part2" ? "studentBookPart2" : "studentBookPart1";
            const sbFile = availability?.files[sbKey];
            const wbFile = availability?.files.workbook;
            const sbLink = refs?.studentBook && sbFile?.exists ? pdfDeepLink(sbFile, refs.studentBook.from) : null;
            const wbLink = refs?.workbook && wbFile?.exists ? pdfDeepLink(wbFile, refs.workbook.from) : null;

            return (
              <div
                key={m.id}
                className="space-y-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Модуль {m.number}
                    </div>
                    <div className="font-display text-lg font-semibold">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{m.topics.join(" · ")}</div>
                  </div>
                  {refs ? null : (
                    <Badge variant="outline" className="text-[10px]">
                      нет привязки к УМК
                    </Badge>
                  )}
                </div>
                {refs ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {refs.studentBook ? (
                      sbLink ? (
                        <a
                          href={sbLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Учебник{refs.studentBook.book === "part2" ? " ч.2" : " ч.1"} · стр.{" "}
                          <b>
                            {refs.studentBook.from}–{refs.studentBook.to}
                          </b>
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                          Учебник{refs.studentBook.book === "part2" ? " ч.2" : " ч.1"} · стр. {refs.studentBook.from}–
                          {refs.studentBook.to} (PDF не загружен)
                        </span>
                      )
                    ) : null}
                    {refs.workbook ? (
                      wbLink ? (
                        <a
                          href={wbLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/15"
                        >
                          <NotebookPen className="h-3.5 w-3.5" />
                          Тетрадь · стр.{" "}
                          <b>
                            {refs.workbook.from}–{refs.workbook.to}
                          </b>
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                          Тетрадь · стр. {refs.workbook.from}–{refs.workbook.to} (PDF не загружен)
                        </span>
                      )
                    ) : null}
                  </div>
                ) : null}
                {refs?.workbookExercises && wbFile?.exists ? (
                  <details className="pt-1 text-xs">
                    <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                      Опорные упражнения тетради ({refs.workbookExercises.length})
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {refs.workbookExercises.map((ex) => (
                        <li key={`${ex.page}-${ex.exercise}`} className="flex items-center gap-2">
                          <a
                            href={pdfDeepLink(wbFile, ex.page) ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 font-mono hover:border-primary/40 hover:bg-primary/5"
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
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function FileButton({ file, icon }: { file: AvailabilityFile | undefined; icon: React.ReactNode }) {
  if (!file) return null;
  if (!file.exists) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {icon}
        {file.short} — нет PDF
      </span>
    );
  }
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/15"
    >
      {icon}
      {file.label}
      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
    </a>
  );
}
