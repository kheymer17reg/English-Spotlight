"use client";

import { useEffect, useState } from "react";
import {
  Bug,
  Heart,
  Inbox,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  id: number;
  createdAt: string;
  kind: "idea" | "bug" | "thanks" | "other";
  userId: string | null;
  userRole: string | null;
  userName: string | null;
  pageUrl: string | null;
  message: string;
  status: "new" | "read" | "done";
}

const KIND_META = {
  idea: { icon: Sparkles, label: "Идея", tone: "from-primary to-accent" },
  bug: { icon: Bug, label: "Баг", tone: "from-rose-500 to-pink-500" },
  thanks: { icon: Heart, label: "Спасибо", tone: "from-emerald-500 to-teal-500" },
  other: {
    icon: MessageSquarePlus,
    label: "Другое",
    tone: "from-slate-500 to-zinc-600",
  },
} as const;

export default function FeedbackAdminPage() {
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "done">("all");
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    setItems(null);
    try {
      const res = await fetch("/api/feedback", { cache: "no-store" });
      if (res.status === 403) {
        setForbidden(true);
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: number, status: "read" | "done") {
    const prev = items;
    setItems((list) =>
      list ? list.map((i) => (i.id === id ? { ...i, status } : i)) : list,
    );
    const res = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) setItems(prev);
  }

  const filtered =
    items?.filter((i) => (filter === "all" ? true : i.status === filter)) ?? [];
  const counts = {
    all: items?.length ?? 0,
    new: items?.filter((i) => i.status === "new").length ?? 0,
    done: items?.filter((i) => i.status === "done").length ?? 0,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold">Обратная связь</h1>
            <p className="text-muted-foreground">
              Сообщения от учеников и коллег. Здесь видит только учитель.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1">
          <RefreshCw className="h-4 w-4" /> Обновить
        </Button>
      </div>

      {forbidden ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Эта страница доступна только учителям. Войди в учительский аккаунт.
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "all", label: "Все", count: counts.all },
            { id: "new", label: "Новые", count: counts.new },
            { id: "done", label: "Обработаны", count: counts.done },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              filter === f.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30",
            )}
          >
            {f.label}
            <Badge variant="outline" className="text-[10px]">
              {f.count}
            </Badge>
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Пока ничего. Когда кто-то напишет через кнопку «Обратная связь», сообщение появится здесь.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const meta = KIND_META[item.kind] ?? KIND_META.other;
            const Icon = meta.icon;
            return (
              <Card
                key={item.id}
                className={cn(
                  "transition-colors",
                  item.status === "new" && "border-primary/30 bg-primary/[0.02]",
                  item.status === "done" && "opacity-70",
                )}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div
                      className={cn(
                        "grid h-9 w-9 flex-none place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                        meta.tone,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {meta.label}
                        </span>
                        <span>·</span>
                        <span>{formatDate(item.createdAt)}</span>
                        {item.userName ? (
                          <>
                            <span>·</span>
                            <span>
                              {item.userName}
                              {item.userRole ? ` (${item.userRole})` : ""}
                            </span>
                          </>
                        ) : (
                          <span className="italic">анонимно</span>
                        )}
                        {item.pageUrl ? (
                          <>
                            <span>·</span>
                            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                              {item.pageUrl}
                            </code>
                          </>
                        ) : null}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                        {item.message}
                      </div>
                    </div>
                    <div className="flex flex-none flex-col items-end gap-1">
                      <Badge
                        variant={
                          item.status === "new"
                            ? "primary"
                            : item.status === "done"
                              ? "success"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {item.status === "new"
                          ? "NEW"
                          : item.status === "done"
                            ? "DONE"
                            : "READ"}
                      </Badge>
                      <div className="flex gap-1">
                        {item.status !== "done" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus(item.id, "done")}
                            className="h-7 px-2 text-xs"
                          >
                            Готово
                          </Button>
                        ) : null}
                        {item.status === "new" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatus(item.id, "read")}
                            className="h-7 px-2 text-xs"
                          >
                            Прочитано
                          </Button>
                        ) : null}
                      </div>
                    </div>
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

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
