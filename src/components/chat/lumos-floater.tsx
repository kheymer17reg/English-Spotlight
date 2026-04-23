"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Loader2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Global Lumos mini-chat floater.
 * Sticks to the bottom-left on every /student page so kids can ask
 * a quick question without navigating away. Shares /api/ai/chat with
 * the full chat page; keeps its own short transcript in memory only.
 */
export function LumosFloater() {
  const student = useStore((s) => s.student);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [open, messages.length, busy]);

  // Hide on the full chat page (redundant), auth, print
  if (
    pathname?.startsWith("/student/chat") ||
    pathname?.startsWith("/auth") ||
    pathname?.endsWith("/print")
  ) {
    return null;
  }

  async function send() {
    const content = input.trim();
    if (!content || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: student?.grade ?? 5,
          messages: next,
        }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setMessages((m) => [...m, { role: "assistant", content: data.text }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.error ?? "Не удалось получить ответ",
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Сеть не отвечает, попробуй ещё раз." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Trigger — positioned above feedback widget (which sits at right-5 bottom-5) */}
      <button
        type="button"
        aria-label="Спросить Lumos"
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "fixed bottom-5 left-5 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-br from-primary to-accent px-4 text-sm font-medium text-white shadow-glow transition-transform hover:scale-105",
          open && "scale-95",
        )}
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">Lumos</span>
      </button>

      {open ? (
        <div className="fixed bottom-20 left-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col rounded-2xl border border-border bg-surface shadow-lifted">
          <div className="flex items-start justify-between gap-3 border-b border-border p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="font-display text-sm font-semibold">Lumos AI</div>
                <div className="text-xs text-muted-foreground">
                  Быстрый вопрос — коротко отвечу
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Закрыть"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="scrollbar-thin max-h-80 min-h-[10rem] flex-1 space-y-2 overflow-y-auto p-3 text-sm"
          >
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                Например: «Как перевести she is reading?» или «объясни this/that»
              </div>
            ) : null}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl px-3 py-2",
                  m.role === "user"
                    ? "ml-6 bg-primary/10 text-foreground"
                    : "mr-6 bg-muted",
                )}
              >
                {m.content}
              </div>
            ))}
            {busy ? (
              <div className="mr-6 flex items-center gap-1 rounded-xl bg-muted px-3 py-2">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
              </div>
            ) : null}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Спроси что-нибудь…"
                rows={1}
                className="max-h-24 min-h-9 resize-none py-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={busy}
              />
              <Button
                size="sm"
                onClick={send}
                disabled={busy || !input.trim()}
                className="h-9 px-3"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Для длинного диалога — открой полный чат
              </span>
              <Link
                href="/student/chat"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
              >
                Открыть чат
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
