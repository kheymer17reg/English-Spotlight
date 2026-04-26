"use client";

/**
 * Teacher live-quiz hub: list recent sessions + quick "create new" form.
 * Once created, jumps to the host view to project the PIN to the class.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface SessionSummary {
  id: string;
  pin: string;
  title: string;
  grade: number;
  status: "lobby" | "active" | "finished";
  createdAt: string;
  finishedAt: string | null;
}

const STATUS_LABEL: Record<SessionSummary["status"], string> = {
  lobby: "Ожидание",
  active: "Идёт",
  finished: "Завершён",
};

export default function TeacherQuizHubPage() {
  const router = useRouter();
  const [list, setList] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState(5);
  const [n, setN] = useState(10);
  const [title, setTitle] = useState("Словарный квиз");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const r = await fetch("/api/quiz/host", { cache: "no-store" });
      if (!r.ok) return;
      const body = (await r.json()) as { sessions: SessionSummary[] };
      setList(body.sessions ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const r = await fetch("/api/quiz/host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, n, title }),
      });
      const body = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        session?: { id: string };
        error?: string;
      };
      if (!r.ok || !body.ok || !body.session) {
        setError(body.error ?? "Не удалось создать квиз");
        return;
      }
      router.push(`/teacher/quiz/${body.session.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-tight">Live-квиз</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Подними PIN на проекторе. Ученики заходят с телефонов на «Live-квиз», вводят PIN, и
              отвечают на скорость. Очки = правильность × скорость.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Новый квиз
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto]">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Название</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Класс</label>
              <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value))}>
                {[2, 3, 4, 5, 6, 7, 8].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Вопросов</label>
              <Select value={String(n)} onChange={(e) => setN(Number(e.target.value))}>
                {[5, 8, 10, 12, 15, 20].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Запустить
              </Button>
            </div>
          </form>
          {error ? <div className="mt-2 text-xs text-rose-600">{error}</div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Последние квизы</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Загружаем…
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
              Пока нет квизов. Создай первый сверху.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{s.title}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {s.grade} кл.
                      </Badge>
                      <Badge
                        variant={s.status === "active" ? "primary" : s.status === "lobby" ? "warning" : "outline"}
                        className="text-[10px]"
                      >
                        {STATUS_LABEL[s.status]}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      PIN <span className="font-mono font-semibold">{s.pin}</span> ·{" "}
                      {new Date(s.createdAt).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <Link href={`/teacher/quiz/${s.id}`}>
                    <Button variant="outline" size="sm">
                      Открыть
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
