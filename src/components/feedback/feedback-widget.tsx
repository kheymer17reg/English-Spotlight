"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bug,
  Check,
  Heart,
  Loader2,
  MessageSquarePlus,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Kind = "idea" | "bug" | "thanks" | "other";

const KIND_META: { id: Kind; label: string; icon: typeof Sparkles; tone: string }[] = [
  { id: "idea", label: "Идея", icon: Sparkles, tone: "from-primary to-accent" },
  { id: "bug", label: "Баг", icon: Bug, tone: "from-rose-500 to-pink-500" },
  { id: "thanks", label: "Спасибо", icon: Heart, tone: "from-emerald-500 to-teal-500" },
  { id: "other", label: "Другое", icon: MessageSquarePlus, tone: "from-slate-500 to-zinc-600" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("idea");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const pathname = usePathname();

  // Hide on auth screens and on embeds
  if (pathname?.startsWith("/auth") || pathname?.endsWith("/print")) {
    return null;
  }

  async function submit() {
    if (!message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, message: message.trim(), pageUrl: pathname }),
      });
      if (!res.ok) throw new Error("network");
      setStatus("sent");
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 1400);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        aria-label="Обратная связь"
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "fixed bottom-[5.25rem] right-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-glow transition-transform hover:scale-105 lg:bottom-5 lg:right-5",
          open && "rotate-45",
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="fixed bottom-36 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-surface shadow-lifted lg:bottom-20 lg:right-5">
          <div className="flex items-start gap-3 border-b border-border p-4">
            <div className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold">
                Поделись впечатлениями
              </div>
              <div className="text-xs text-muted-foreground">
                Что можно улучшить? Мы читаем всё.
              </div>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-4 gap-1">
              {KIND_META.map((k) => {
                const Icon = k.icon;
                const active = kind === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={cn(
                      "group flex flex-col items-center gap-1 rounded-lg border p-2 text-[11px] font-medium transition-all",
                      active
                        ? "border-transparent bg-gradient-to-br text-white shadow-sm " + k.tone
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {k.label}
                  </button>
                );
              })}
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Твоё сообщение…"
              rows={4}
              maxLength={4000}
              disabled={status === "sending" || status === "sent"}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">
                {status === "error"
                  ? "Не отправилось, попробуй ещё раз"
                  : status === "sent"
                    ? "Отправлено! Спасибо"
                    : `${message.length}/4000`}
              </span>
              <Button
                size="sm"
                onClick={submit}
                disabled={!message.trim() || status === "sending" || status === "sent"}
                className="gap-1"
              >
                {status === "sending" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : status === "sent" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {status === "sent" ? "Отправлено" : "Отправить"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
