"use client";

/**
 * Class activity feed: a low-friction social layer where peers see each other's
 * milestones (lesson done, badge, streak, level up, perfect score) and react with
 * an emoji set. Posts are produced server-side automatically off `recordActivity`,
 * so students don't type free text — keeps it moderation-light and safe.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Flame, GraduationCap, Loader2, Sparkles, Star, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { FeedPostKind, FeedReactionEmoji } from "@/lib/feed-db";

interface FeedPost {
  id: number;
  classId: string;
  authorId: string;
  authorName: string;
  authorGrade: number | null;
  kind: FeedPostKind;
  payload: Record<string, unknown>;
  createdAt: string;
  reactions: { emoji: FeedReactionEmoji; count: number; mine: boolean }[];
}

interface ClassRecord {
  id: string;
  name: string;
  grade: number;
}

const REACTION_EMOJIS: FeedReactionEmoji[] = ["👍", "🔥", "💪", "⭐", "🎉"];

const KIND_META: Record<FeedPostKind, { icon: typeof Sparkles; tone: string; label: string }> = {
  lesson_done: { icon: GraduationCap, tone: "bg-sky-500/10 text-sky-600", label: "урок" },
  badge_unlocked: { icon: Award, tone: "bg-amber-500/10 text-amber-600", label: "ачивка" },
  streak_milestone: { icon: Flame, tone: "bg-orange-500/10 text-orange-600", label: "стрик" },
  level_up: { icon: Star, tone: "bg-violet-500/10 text-violet-600", label: "уровень" },
  perfect_score: { icon: Target, tone: "bg-emerald-500/10 text-emerald-600", label: "топ" },
  vocab_milestone: { icon: Sparkles, tone: "bg-primary/10 text-primary", label: "словарь" },
  teacher_note: { icon: Sparkles, tone: "bg-primary/10 text-primary", label: "учитель" },
};

function formatPostText(post: FeedPost): string {
  const p = post.payload;
  switch (post.kind) {
    case "badge_unlocked": {
      const id = String(p.badgeId ?? "");
      return `получил ачивку ${id || "—"}`;
    }
    case "streak_milestone":
      return `держит стрик ${String(p.streak ?? "")} дней подряд 🔥`;
    case "level_up":
      return `вышел на уровень ${String(p.toLevel ?? "")}`;
    case "perfect_score": {
      const total = Number(p.total ?? 0);
      return `сделал ${total} из ${total} в упражнении без ошибок`;
    }
    case "vocab_milestone":
      return `выучил ${String(p.count ?? "")} слов`;
    case "lesson_done":
      return `закончил урок «${String(p.title ?? "")}»`;
    case "teacher_note":
      return String(p.text ?? "");
    default:
      return "сделал что-то крутое";
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} д назад`;
  return new Date(iso).toLocaleDateString("ru-RU");
}

export default function FeedPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [activeClass, setActiveClass] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/classes?scope=mine", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { classes: ClassRecord[] };
        if (cancelled) return;
        setClasses(data.classes ?? []);
        if (data.classes?.[0]) setActiveClass(data.classes[0].id);
      } catch {
        // ignore — UI handles empty state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!activeClass) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/feed?classId=${encodeURIComponent(activeClass)}`, {
        cache: "no-store",
      });
      if (!r.ok) {
        setPosts([]);
      } else {
        const data = (await r.json()) as { posts: FeedPost[] };
        setPosts(data.posts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [activeClass]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Polite polling — every 60 seconds when tab visible.
  useEffect(() => {
    if (!activeClass) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60_000);
    return () => clearInterval(interval);
  }, [refresh, activeClass]);

  const onReact = async (postId: number, emoji: FeedReactionEmoji) => {
    // Optimistic toggle.
    setPosts((cur) =>
      cur.map((p) =>
        p.id === postId
          ? {
              ...p,
              reactions: p.reactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count + (r.mine ? -1 : 1), mine: !r.mine }
                  : r,
              ),
            }
          : p,
      ),
    );
    try {
      await fetch("/api/feed/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, emoji }),
      });
    } catch {
      // Revert on error by refetching.
      void refresh();
    }
  };

  const totalReactionsToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return posts
      .filter((p) => p.createdAt.slice(0, 10) === today)
      .reduce((acc, p) => acc + p.reactions.reduce((a, r) => a + r.count, 0), 0);
  }, [posts]);

  if (!classes.length && !loading) {
    return (
      <EmptyState
        title="Сначала вступи в класс"
        description="Лента активности появляется в рамках класса. Открой раздел «Мои классы» и введи код от учителя."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Лента класса</h1>
          <p className="text-muted-foreground">
            Здесь видно, как продвигаются одноклассники. Поддержи их реакцией —
            это бесплатно, но мотивирует.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 rounded-lg bg-surface px-2 py-1">
            <Sparkles className="h-3 w-3 text-primary" /> {totalReactionsToday} реакций сегодня
          </span>
        </div>
      </div>

      {classes.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveClass(c.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                activeClass === c.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {c.name}
              <span className="ml-1.5 text-[10px] text-muted-foreground">{c.grade} кл.</span>
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загружаем ленту…
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Пока тихо. Сделай задание — и твой результат окажется в ленте, а
            одноклассники увидят и поддержат.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const meta = KIND_META[post.kind];
            const Icon = meta.icon;
            return (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("grid h-10 w-10 flex-none place-items-center rounded-xl", meta.tone)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <span className="font-semibold">{post.authorName}</span>
                        {post.authorGrade ? (
                          <Badge variant="outline" className="text-[10px]">
                            {post.authorGrade} кл.
                          </Badge>
                        ) : null}
                        <Badge variant="accent" className="text-[10px] uppercase tracking-wider">
                          {meta.label}
                        </Badge>
                        <span className="ml-auto text-[11px] text-muted-foreground">
                          {relativeTime(post.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-foreground/90">{formatPostText(post)}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {REACTION_EMOJIS.map((emoji) => {
                      const r = post.reactions.find((x) => x.emoji === emoji);
                      const count = r?.count ?? 0;
                      const mine = r?.mine ?? false;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => void onReact(post.id, emoji)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-all",
                            mine
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                          aria-label={`Реагировать ${emoji}`}
                          aria-pressed={mine}
                        >
                          <span>{emoji}</span>
                          {count > 0 ? <span className="text-xs font-medium">{count}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
