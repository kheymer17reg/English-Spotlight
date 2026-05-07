"use client";

/**
 * Photo homework: ученик фоткает тетрадь, AI делает OCR + грамматический разбор,
 * учитель потом ставит финальную оценку. Снимает боль "учитель собирает фотки в WhatsApp".
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface SubmissionMeta {
  id: string;
  classId: string | null;
  homeworkId: string | null;
  title: string | null;
  comment: string | null;
  ocrText: string | null;
  aiFeedback: string | null;
  aiSuggestedGrade: number | null;
  teacherGrade: number | null;
  teacherComment: string | null;
  status: "submitted" | "graded";
  createdAt: string;
  gradedAt: string | null;
  hasImage: true;
}

interface ClassSummary {
  id: string;
  name: string;
}

export default function PhotoHomeworkPage() {
  const student = useStore((s) => s.student);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionMeta[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const refresh = useMemo(
    () => async () => {
      try {
        const r = await fetch("/api/homework/photo", { cache: "no-store" });
        if (!r.ok) return;
        const body = (await r.json()) as { submissions: SubmissionMeta[] };
        setSubmissions(body.submissions);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  useEffect(() => {
    void refresh();
    void (async () => {
      try {
        const r = await fetch("/api/classes", { cache: "no-store" });
        if (!r.ok) return;
        const body = (await r.json()) as { classes?: ClassSummary[] };
        if (Array.isArray(body.classes)) setClasses(body.classes);
      } catch {
        /* ignore */
      }
    })();
  }, [refresh]);

  const onPick = (f: File | null) => {
    setFile(f);
    setError(null);
    if (!f) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Файл больше 4 МБ — сожми фото или сделай ещё раз");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      if (classId) form.append("classId", classId);
      if (title.trim()) form.append("title", title.trim());
      if (comment.trim()) form.append("comment", comment.trim());
      const r = await fetch("/api/homework/photo", { method: "POST", body: form });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Не удалось отправить");
        return;
      }
      setFile(null);
      setPreview(null);
      setTitle("");
      setComment("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft">
            <Camera className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold leading-tight">Фото-домашка</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Сфоткай тетрадь — AI расшифрует текст и подскажет ошибки, учитель поставит оценку.
            </p>
          </div>
          <Link
            href="/student/homework"
            className="hidden rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted sm:inline-flex"
          >
            ← К заданиям
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Класс (необязательно)</label>
              <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Не привязывать</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Заголовок</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Упр. 5, стр. 32"
                maxLength={80}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Комментарий учителю</label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Что не получилось, что хочется проверить"
              maxLength={300}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              className="gap-2"
              type="button"
            >
              <Camera className="h-4 w-4" /> Сделать фото
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
              type="button"
            >
              <Upload className="h-4 w-4" /> Из галереи
            </Button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />

          {preview ? (
            <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Превью" className="max-h-80 w-full object-contain" />
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {file ? `${(file.size / 1024).toFixed(0)} КБ • ${file.type.split("/")[1] ?? "img"}` : "Файл не выбран"}
            </div>
            <Button onClick={submit} disabled={!file || busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {busy ? "AI разбирает…" : "Отправить"}
            </Button>
          </div>
          {error ? <div className="text-xs text-rose-600">{error}</div> : null}
          {!student?.id ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              Войди в аккаунт, чтобы прикрепить фото к классу и журналу.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Мои отправки</h2>
          {submissions.length > 0 ? (
            <Badge variant="default">{submissions.length}</Badge>
          ) : null}
        </div>
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
              <ImageIcon className="h-5 w-5" /> Пока нет отправок
            </CardContent>
          </Card>
        ) : (
          submissions.map((s) => (
            <Card key={s.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-medium">{s.title ?? "Без названия"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.aiSuggestedGrade !== null ? (
                      <Badge variant="default" className="gap-1">
                        AI · {s.aiSuggestedGrade}
                      </Badge>
                    ) : null}
                    {s.teacherGrade !== null ? (
                      <Badge
                        variant="accent"
                        className={cn(
                          "gap-1",
                          s.teacherGrade >= 4 && "bg-emerald-500/15 text-emerald-700",
                        )}
                      >
                        <CheckCircle2 className="h-3 w-3" /> {s.teacherGrade}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">На проверке</Badge>
                    )}
                  </div>
                </div>
                {s.ocrText ? (
                  <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm leading-relaxed">
                    {s.ocrText}
                  </div>
                ) : null}
                {s.aiFeedback ? (
                  <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm">
                    <div className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
                      <Sparkles className="h-3 w-3" /> Разбор Lumos
                    </div>
                    <div className="whitespace-pre-line text-foreground/90">{s.aiFeedback}</div>
                  </div>
                ) : null}
                {s.teacherComment ? (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm">
                    <div className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Комментарий учителя
                    </div>
                    <div>{s.teacherComment}</div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
