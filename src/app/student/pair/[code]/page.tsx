"use client";

/**
 * Pair-roleplay live chat. Polls the room every 3s when not actively typing,
 * sends own messages via /api/pair/[code]/message and shows Lumos correction
 * inline on the user's own bubbles.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Loader2, Send, Sparkles, Volume2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  code: string;
  scenario: string;
  grade: number;
  roleA: string;
  roleB: string;
  slotAUserId: string;
  slotBUserId: string | null;
  status: "waiting" | "active" | "done" | "expired";
  currentTurn: "A" | "B";
  createdAt: string;
  expiresAt: string;
}

interface Message {
  id: number;
  roomId: string;
  slot: "A" | "B";
  text: string;
  correction: string | null;
  createdAt: string;
}

interface PairResponse {
  room: Room;
  mySlot: "A" | "B" | null;
  partnerNames: { A: string; B: string | null };
  messages: Message[];
}

interface LumosCorrection {
  ok: boolean;
  fixed: string;
  tip: string;
  tags: string[];
}

function parseCorrection(raw: string | null): LumosCorrection | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LumosCorrection;
  } catch {
    return null;
  }
}

function scenarioTitle(scenario: string): string {
  const idx = scenario.indexOf(":");
  return idx >= 0 ? scenario.slice(idx + 1) : scenario;
}

export default function PairChatPage({ params }: { params: { code: string } }) {
  const [data, setData] = useState<PairResponse | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const code = params.code.toUpperCase();

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/pair/${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Комната недоступна");
        return;
      }
      const body = (await r.json()) as PairResponse;
      setData(body);
      setError(null);
    } catch {
      setError("Сеть недоступна. Попробую ещё раз через секунду.");
    }
  }, [code]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Light polling: 2s while waiting for partner / waiting for partner's turn,
  // 4s after I just sent (to catch the partner's reply quickly without
  // overloading the server).
  useEffect(() => {
    if (!data) return;
    const myTurn =
      data.mySlot !== null && data.room.currentTurn === data.mySlot && data.room.status === "active";
    const interval = setInterval(
      () => {
        if (document.visibilityState === "visible") void refresh();
      },
      myTurn ? 6000 : 2500,
    );
    return () => clearInterval(interval);
  }, [data, refresh]);

  // Auto-scroll on new messages.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.messages.length]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/pair/${encodeURIComponent(code)}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const body = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !body.ok) {
        setError(body.error ?? "Не получилось отправить");
        return;
      }
      setText("");
      await refresh();
    } finally {
      setSending(false);
    }
  };

  const speakSentence = (s: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(s);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  const onFinish = async () => {
    if (!confirm("Завершить роль-плей?")) return;
    await fetch(`/api/pair/${encodeURIComponent(code)}/finish`, {
      method: "POST",
    });
    await refresh();
  };

  const myRole = useMemo(() => {
    if (!data || !data.mySlot) return null;
    return data.mySlot === "A" ? data.room.roleA : data.room.roleB;
  }, [data]);
  const partnerRole = useMemo(() => {
    if (!data || !data.mySlot) return null;
    return data.mySlot === "A" ? data.room.roleB : data.room.roleA;
  }, [data]);

  if (error && !data) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="space-y-3 p-6 text-center">
          <div className="text-sm text-rose-600">{error}</div>
          <Link href="/student/pair">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> К сценариям
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загружаем комнату…
      </div>
    );
  }

  const myTurn =
    data.mySlot !== null &&
    data.room.currentTurn === data.mySlot &&
    data.room.status === "active";
  const finished = data.room.status === "done" || data.room.status === "expired";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3" style={{ minHeight: "calc(100dvh - 8rem)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href="/student/pair" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-xl font-semibold">{scenarioTitle(data.room.scenario)}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          {data.room.status === "waiting" ? (
            <Badge variant="warning" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Ждём партнёра
            </Badge>
          ) : finished ? (
            <Badge variant="outline">Завершено</Badge>
          ) : myTurn ? (
            <Badge variant="primary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Твой ход
            </Badge>
          ) : (
            <Badge variant="accent">Ход партнёра</Badge>
          )}
          {!finished ? (
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => void onFinish()}>
              <X className="h-3.5 w-3.5" /> Завершить
            </Button>
          ) : null}
        </div>
      </div>

      {data.room.status === "waiting" ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="space-y-1 text-sm">
              <div className="font-medium">Дай партнёру код:</div>
              <div className="text-xs text-muted-foreground">
                Он введёт его в «Парный роль-плей» → «Войти по коду» — и ты получишь свою роль{" "}
                <span className="font-semibold">{myRole}</span>.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-primary/30 bg-surface px-4 py-2 font-mono text-2xl font-bold tracking-[0.4em] text-primary">
                {data.room.code}
              </div>
              <Button onClick={onCopy} variant="outline" size="sm" className="gap-2">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Скопировано" : "Копировать"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <Card>
            <CardContent className="p-3 text-xs">
              <div className="text-muted-foreground">Твоя роль</div>
              <div className="font-semibold">{myRole ?? "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-xs">
              <div className="text-muted-foreground">Партнёр играет</div>
              <div className="font-semibold">{partnerRole ?? "—"}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-border bg-surface/40 p-3"
      >
        {data.messages.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {data.room.status === "waiting"
              ? "Партнёр ещё не подключился."
              : myTurn
              ? "Начинай — твой ход."
              : "Партнёр печатает…"}
          </div>
        ) : (
          data.messages.map((m) => {
            const mine = data.mySlot === m.slot;
            const author = m.slot === "A" ? data.partnerNames.A : data.partnerNames.B ?? "Партнёр";
            const correction = parseCorrection(m.correction);
            const showCorrection = mine && correction && !correction.ok && correction.tip;
            return (
              <div key={m.id} className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] space-y-1.5")}>
                  <div className="flex items-baseline gap-2 text-[11px] text-muted-foreground">
                    {!mine ? <span className="font-medium">{author}</span> : null}
                    <span>
                      {new Date(m.createdAt).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm shadow-sm",
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {m.text}
                  </div>
                  {showCorrection ? (
                    <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-3 shadow-soft">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                          <Sparkles className="h-3.5 w-3.5" /> Lumos подсказывает
                        </div>
                      </div>
                      {correction!.fixed ? (
                        <div className="mb-2 rounded-md border border-amber-500/30 bg-surface/70 px-2.5 py-1.5">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Правильный вариант</div>
                          <div className="text-sm font-medium text-foreground">{correction!.fixed}</div>
                        </div>
                      ) : null}
                      <div className="text-sm leading-snug text-foreground/90">{correction!.tip}</div>
                      {correction!.fixed ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => speakSentence(correction!.fixed)}
                            className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-surface/60 px-2 py-1 text-xs hover:bg-amber-500/15"
                          >
                            <Volume2 className="h-3 w-3" /> Произнести
                          </button>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(correction!.fixed)}
                            className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-surface/60 px-2 py-1 text-xs hover:bg-amber-500/15"
                          >
                            <Copy className="h-3 w-3" /> Скопировать
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!finished ? (
        <form onSubmit={onSend} className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              data.room.status === "waiting"
                ? "Подожди партнёра…"
                : myTurn
                ? "Напиши по-английски…"
                : "Сейчас ход партнёра"
            }
            disabled={!myTurn || sending}
            maxLength={400}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSend(e as unknown as React.FormEvent);
              }
            }}
          />
          <Button type="submit" disabled={!myTurn || sending || !text.trim()} className="gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Отправить
          </Button>
        </form>
      ) : (
        <Card>
          <CardContent className="space-y-2 p-4 text-center text-sm">
            <div className="font-medium">Сессия завершена</div>
            <div className="text-muted-foreground">
              Реплик сыграно: {data.messages.length}. Все поправки Lumos уже видны в твоих сообщениях
              выше.
            </div>
            <div className="flex justify-center gap-2 pt-1">
              <Link href="/student/pair">
                <Button size="sm" className="gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> Ещё раз
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      {error ? <div className="text-center text-xs text-rose-600">{error}</div> : null}
    </div>
  );
}
