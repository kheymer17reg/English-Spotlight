"use client";

/**
 * Parent dashboard: list bound children and a form to add a new one by code.
 *
 * Parents are read-only. They never see other students' data, only their own
 * children. Each child links to a detail page that reuses /api/student/summary.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Loader2, Plus, Sparkles, Star, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";

interface ChildRow {
  id: string;
  name: string;
  grade: number;
  xp: number;
  level: number;
  streak: number;
}

export default function ParentHome() {
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/parent/children", { cache: "no-store" });
      if (!r.ok) {
        setChildren([]);
      } else {
        const data = (await r.json()) as { children: ChildRow[] };
        setChildren(data.children ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError("Введите код ребёнка (6 знаков, без пробелов)");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/parent/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string; student?: { name: string } };
      if (!r.ok || !data.ok) {
        setError(data.error ?? "Не удалось привязать");
        return;
      }
      setSuccess(`Ребёнок «${data.student?.name ?? "—"}» добавлен`);
      setCode("");
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const onUnlink = async (studentId: string, name: string) => {
    if (!confirm(`Отвязать «${name}»? Доступ можно вернуть, если снова ввести код.`)) return;
    await fetch("/api/parent/link", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Дети</h1>
        <p className="text-muted-foreground">
          Здесь видно, как идут учебные дела ребёнка. Доступ только на просмотр.
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-accent/5">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Добавить ребёнка
          </div>
          <p className="text-sm text-muted-foreground">
            Попроси ребёнка открыть «Профиль» в его кабинете и продиктуй 6-значный код. Он
            одинаковый и не меняется.
          </p>
          <form onSubmit={onLink} className="flex flex-wrap items-center gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC234"
              maxLength={8}
              className="w-40 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-base uppercase tracking-[0.2em] focus:border-primary focus:outline-none"
            />
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Привязать
            </Button>
          </form>
          {error ? <div className="text-sm text-rose-600">{error}</div> : null}
          {success ? <div className="text-sm text-emerald-600">{success}</div> : null}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загружаем детей…
        </div>
      ) : children.length === 0 ? (
        <EmptyState
          title="Пока никого не привязали"
          description="Введи код, который покажет ребёнок в своём профиле — и здесь появится карточка."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {children.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.grade} класс</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                    onClick={() => void onUnlink(c.id, c.name)}
                    aria-label="Отвязать"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="primary" className="gap-1">
                    <Trophy className="h-3 w-3" /> Ур. {c.level}
                  </Badge>
                  <Badge variant="accent" className="gap-1">
                    <Star className="h-3 w-3" /> {c.xp} XP
                  </Badge>
                  {c.streak > 0 ? (
                    <Badge variant="warning" className="gap-1">
                      <Flame className="h-3 w-3" /> {c.streak} дн.
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <Flame className="h-3 w-3" /> 0 дн.
                    </Badge>
                  )}
                </div>
                <div className="flex justify-end">
                  <Link href={`/parent/${c.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Sparkles className="h-3.5 w-3.5" /> Подробно
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
