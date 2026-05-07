"use client";

/**
 * Teacher review for photo homework submissions. Lists pending + recently
 * graded items, expand to see image + OCR + AI feedback, then post final grade
 * via PATCH /api/homework/photo/[id]. Server pushes a notification to the
 * student.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ListItem {
  id: string;
  studentId: string;
  classId: string | null;
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
}

interface DetailItem extends ListItem {
  imageData: string;
  mime: string;
}

interface ClassRow {
  id: string;
  name: string;
}

interface StudentRow {
  id: string;
  name: string;
}

export default function TeacherPhotoHwPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classFilter, setClassFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "graded">("submitted");
  const [items, setItems] = useState<ListItem[]>([]);
  const [students, setStudents] = useState<Record<string, StudentRow>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailItem | null>(null);
  const [grade, setGrade] = useState<string>("4");
  const [comment, setComment] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/classes?scope=teacher", { cache: "no-store" });
        if (!r.ok) return;
        const body = (await r.json()) as { classes?: ClassRow[] };
        setClasses(body.classes ?? []);
      } catch { /* ignore */ }
    })();
  }, []);

  const refresh = useMemo(
    () => async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (classFilter) params.set("classId", classFilter);
        const r = await fetch(`/api/teacher/photo-homework?${params.toString()}`, { cache: "no-store" });
        if (!r.ok) return;
        const body = (await r.json()) as { submissions: ListItem[] };
        setItems(body.submissions);
      } finally {
        setLoading(false);
      }
    },
    [classFilter],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Load student names for the visible items.
  useEffect(() => {
    const missing = items
      .map((i) => i.studentId)
      .filter((id, idx, arr) => arr.indexOf(id) === idx && !students[id]);
    if (missing.length === 0) return;
    void (async () => {
      try {
        const r = await fetch(`/api/teacher/students?ids=${missing.join(",")}`, { cache: "no-store" });
        if (!r.ok) return;
        const body = (await r.json()) as { students?: StudentRow[] };
        if (Array.isArray(body.students)) {
          setStudents((prev) => {
            const next = { ...prev };
            for (const s of body.students!) next[s.id] = s;
            return next;
          });
        }
      } catch { /* ignore */ }
    })();
  }, [items, students]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const open = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    setError(null);
    try {
      const r = await fetch(`/api/homework/photo/${id}`, { cache: "no-store" });
      if (!r.ok) {
        setError("Не удалось открыть отправку");
        return;
      }
      const body = (await r.json()) as { submission: DetailItem };
      setDetail(body.submission);
      setGrade(String(body.submission.teacherGrade ?? body.submission.aiSuggestedGrade ?? 4));
      setComment(body.submission.teacherComment ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети");
    }
  };

  const save = async () => {
    if (!detail) return;
    const g = Number(grade);
    if (!Number.isFinite(g) || g < 2 || g > 5) {
      setError("Оценка от 2 до 5");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`/api/homework/photo/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: g, comment: comment.trim() || null }),
      });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Ошибка сохранения");
        return;
      }
      setOpenId(null);
      setDetail(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft">
            <Camera className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold leading-tight">Фото-домашка</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Ученики сфоткали тетради, AI распознал текст и предложил оценку. Подтверди или поправь.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              <Filter className="mr-1 inline h-3 w-3" /> Класс
            </label>
            <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">Все мои классы</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Статус</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="submitted">На проверке</option>
              <option value="graded">Проверены</option>
              <option value="all">Все</option>
            </Select>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {loading ? <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> загружаем</span> : `${filtered.length} отправок`}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 && !loading ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Пусто. Когда ученики начнут фоткать тетради, отправки появятся здесь.
          </CardContent>
        </Card>
      ) : null}

      {filtered.map((s) => {
        const studentName = students[s.studentId]?.name ?? "Ученик";
        const isOpen = openId === s.id;
        return (
          <Card key={s.id} className={cn(isOpen && "border-primary/40 ring-1 ring-primary/20")}>
            <CardContent className="space-y-3 p-4">
              <button
                type="button"
                onClick={() => void open(s.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
              >
                <div className="space-y-0.5">
                  <div className="font-medium">{studentName} • {s.title ?? "Без названия"}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(s.createdAt).toLocaleString("ru-RU", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                    {s.comment ? <span>• {s.comment}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.aiSuggestedGrade !== null ? (
                    <Badge variant="default" className="gap-1 text-[10px]">
                      <Sparkles className="h-3 w-3" /> AI · {s.aiSuggestedGrade}
                    </Badge>
                  ) : null}
                  {s.status === "graded" ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {s.teacherGrade}
                    </Badge>
                  ) : (
                    <Badge variant="warning">На проверке</Badge>
                  )}
                </div>
              </button>

              {isOpen ? (
                <div className="space-y-3 border-t border-border pt-3">
                  {!detail ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Загружаем фото…
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={detail.imageData} alt="Фото-ДЗ" className="max-h-[480px] w-full object-contain" />
                        </div>
                        <div className="space-y-3">
                          {detail.ocrText ? (
                            <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm leading-relaxed">
                              <div className="mb-1 text-xs font-medium text-muted-foreground">Распознанный текст</div>
                              {detail.ocrText}
                            </div>
                          ) : null}
                          {detail.aiFeedback ? (
                            <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm">
                              <div className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
                                <Sparkles className="h-3 w-3" /> Разбор Lumos
                              </div>
                              <div className="whitespace-pre-line text-foreground/90">{detail.aiFeedback}</div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid items-end gap-3 sm:grid-cols-[120px,1fr,auto]">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Оценка</label>
                          <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                            {[2, 3, 4, 5].map((g) => (
                              <option key={g} value={String(g)}>{g}</option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Комментарий ученику</label>
                          <Input
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Молодец, но обрати внимание на артикли"
                            maxLength={500}
                          />
                        </div>
                        <Button onClick={save} disabled={saving} className="gap-2">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Сохранить
                        </Button>
                      </div>
                      {error ? <div className="text-xs text-rose-600">{error}</div> : null}
                    </>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
