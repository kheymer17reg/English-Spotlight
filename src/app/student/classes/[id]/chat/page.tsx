"use client";

/**
 * Class chat: a low-pressure space for the whole class to write to each other
 * in English. After every student message, Lumos adds a tiny inline correction
 * (one fix + one Russian tip) — same shape as in pair roleplay. Teacher
 * messages are not auto-corrected (their authority stays intact). Live updates
 * via SSE; new messages and deletions arrive instantly.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: number;
  classId: string;
  authorUserId: string;
  authorName: string;
  authorRole: "student" | "teacher";
  text: string;
  correction: string | null;
  createdAt: string;
}

interface LumosCorrection {
  ok: boolean;
  fixed: string;
  tip: string;
  tags: string[];
}

interface ClassRecord {
  id: string;
  name: string;
  grade: number;
}

function chatInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function parseCorrection(raw: string | null): LumosCorrection | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LumosCorrection;
  } catch {
    return null;
  }
}

export default function ClassChatPage() {
  const params = useParams<{ id: string }>();
  const classId = params?.id ?? "";

  const session = useSession();
  const me = session.data?.user
    ? {
        id: session.data.user.id,
        role: session.data.user.role,
      }
    : null;

  const [meta, setMeta] = useState<ClassRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hydrate class meta once.
  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/classes?scope=mine`, { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { classes: ClassRecord[] };
        if (cancelled) return;
        setMeta(data.classes.find((c) => c.id === classId) ?? null);
      } catch {
        if (!cancelled) setError("Не удалось загрузить класс");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const refresh = useCallback(async () => {
    if (!classId) return;
    try {
      const r = await fetch(`/api/classes/${encodeURIComponent(classId)}/chat`, {
        cache: "no-store",
      });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Чат недоступен");
        return;
      }
      const body = (await r.json()) as { messages: ChatMessage[] };
      setMessages(body.messages ?? []);
      setError(null);
    } catch {
      setError("Сеть недоступна");
    }
  }, [classId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // SSE for live updates.
  useEffect(() => {
    if (!classId) return;
    const url = `/api/classes/${encodeURIComponent(classId)}/chat/stream`;
    const es = new EventSource(url, { withCredentials: true });
    const onMessage = () => void refresh();
    const onDeleted = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data) as { messageId: number };
        setMessages((cur) => cur.filter((m) => m.id !== data.messageId));
      } catch {
        void refresh();
      }
    };
    es.addEventListener("chat.message", onMessage as EventListener);
    es.addEventListener("chat.deleted", onDeleted as EventListener);
    return () => {
      es.removeEventListener("chat.message", onMessage as EventListener);
      es.removeEventListener("chat.deleted", onDeleted as EventListener);
      es.close();
    };
  }, [classId, refresh]);

  // Auto-scroll on new messages.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/classes/${encodeURIComponent(classId)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const body = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !body.ok) {
        setError(body.error ?? "Не получилось отправить");
        return;
      }
      setText("");
      // SSE will refresh; if we lost the connection the optimistic refresh
      // here keeps the UX snappy.
      await refresh();
    } finally {
      setSending(false);
    }
  };

  const onDelete = async (messageId: number) => {
    if (!confirm("Удалить сообщение?")) return;
    await fetch(
      `/api/classes/${encodeURIComponent(classId)}/chat/${messageId}`,
      { method: "DELETE" },
    );
    setMessages((cur) => cur.filter((m) => m.id !== messageId));
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3" style={{ minHeight: "calc(100dvh - 8rem)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/student/classes"
            className="text-muted-foreground hover:text-foreground"
            aria-label="К классам"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-xl font-semibold">
            {meta?.name ?? "Классный чат"}
          </h1>
          {meta ? (
            <Badge variant="outline" className="text-[11px]">
              {meta.grade} кл.
            </Badge>
          ) : null}
        </div>
        <Badge variant="primary" className="gap-1">
          <Sparkles className="h-3 w-3" /> Lumos подсказывает
        </Badge>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-border bg-surface/40 p-3"
      >
        {messages.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Пока тихо. Напиши первое сообщение по-английски — Lumos поправит, если что.
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = me?.id === m.authorUserId;
            const teacherTone = m.authorRole === "teacher";
            const correction = parseCorrection(m.correction);
            const showCorrection =
              mine && correction && !correction.ok && correction.tip;
            const canDelete =
              mine || me?.role === "teacher";
            const prev = messages[i - 1];
            const sameAuthor = prev?.authorUserId === m.authorUserId;
            const showAvatar = !mine && !sameAuthor;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex w-full items-end gap-2",
                  mine ? "flex-row-reverse" : "flex-row",
                  sameAuthor ? "mt-0.5" : "mt-2",
                )}
              >
                {!mine ? (
                  showAvatar ? (
                    <div
                      className={cn(
                        "grid h-8 w-8 flex-none place-items-center rounded-full text-xs font-semibold ring-2",
                        teacherTone
                          ? "bg-gradient-to-br from-primary to-accent text-primary-foreground ring-primary/30"
                          : "bg-gradient-to-br from-sky-500/20 to-violet-500/20 text-foreground ring-border",
                      )}
                      title={m.authorName}
                    >
                      {chatInitials(m.authorName)}
                    </div>
                  ) : (
                    <div className="h-8 w-8 flex-none" aria-hidden />
                  )
                ) : null}
                <div className={cn("max-w-[78%] space-y-1", mine ? "items-end" : "items-start")}>
                  {!mine && !sameAuthor ? (
                    <div className="flex items-center gap-1.5 px-1 text-[11px]">
                      <span className={cn("font-medium", teacherTone ? "text-primary" : "text-foreground")}>
                        {m.authorName}
                      </span>
                      {teacherTone ? (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-primary">
                          учитель
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className={cn("group flex items-end gap-1", mine ? "flex-row-reverse" : "flex-row")}>
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm shadow-sm",
                        mine
                          ? "bg-primary text-primary-foreground"
                          : teacherTone
                          ? "border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 text-foreground"
                          : "border border-border bg-surface text-foreground",
                      )}
                    >
                      {m.text}
                    </div>
                    <div className="flex items-center gap-1 px-1 pb-0.5 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      <span>
                        {new Date(m.createdAt).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => void onDelete(m.id)}
                          className="rounded p-0.5 hover:bg-rose-500/10 hover:text-rose-600"
                          aria-label="Удалить"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {showCorrection ? (
                    <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-2.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        <Sparkles className="h-3 w-3" /> Lumos
                      </div>
                      {correction!.fixed ? (
                        <div className="mb-1 rounded-md border border-amber-500/30 bg-surface/60 px-2 py-1 text-sm font-medium text-foreground">
                          {correction!.fixed}
                        </div>
                      ) : null}
                      <div className="text-xs leading-snug text-foreground/90">{correction!.tip}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Card>
        <CardContent className="p-3">
          <form onSubmit={onSend} className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Напиши сообщение по-английски…"
              maxLength={500}
              rows={2}
              className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend(e as unknown as React.FormEvent);
                }
              }}
              disabled={sending}
            />
            <Button type="submit" disabled={sending || !text.trim()} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Отправить
            </Button>
          </form>
          {error ? <div className="mt-2 text-xs text-rose-600">{error}</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
