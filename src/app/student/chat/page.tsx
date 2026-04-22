"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import type { ChatMessage, ProviderInfo } from "@/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Объясни разницу между Present Simple и Present Continuous",
  "Как задать вопрос в прошедшем времени?",
  "Проверь: He go to school every day",
  "Дай 5 слов на тему 'еда'",
];

export default function ChatPage() {
  const student = useStore((s) => s.student);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/rag/status")
      .then((r) => r.json())
      .then((d) => setProvider(d.provider))
      .catch(() => {});
  }, []);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    const newMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: student?.grade ?? 5,
          messages: newMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "AI не ответил");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.text }]);
      }
    } catch {
      setError("Сбой сети");
    } finally {
      setBusy(false);
    }
  };

  const startMic = () => {
    const SR: any =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;
    if (!SR) {
      setError("Голосовой ввод поддерживается только в Chrome / Edge");
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (ev: any) => {
      const t = ev.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " : "") + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Lumos AI</h1>
            <p className="text-sm text-muted-foreground">Твой персональный AI-учитель по Spotlight</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {provider ? (
            provider.configured ? (
              <Badge variant="success" className="gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> {provider.name} · {provider.model}
              </Badge>
            ) : (
              <Badge variant="warning">AI ключ не настроен</Badge>
            )
          ) : null}
        </div>
      </div>

      <Card className="flex flex-col" style={{ minHeight: "60vh" }}>
        <CardContent className="flex flex-1 flex-col gap-4 p-4">
          <div ref={viewportRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin pr-1">
            {messages.length === 0 ? (
              <div className="grid place-items-center py-12 text-center">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Спроси что угодно по английскому</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Я знаю программу Spotlight {student?.grade ?? "2–8"} класса и отвечаю по-русски с английскими примерами.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role !== "user" ? (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {busy ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                Lumos печатает…
              </div>
            ) : null}
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t border-border pt-3"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Напиши Lumos… (Enter — отправить, Shift+Enter — новая строка)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              className="min-h-[44px] resize-none"
            />
            <Button
              type="button"
              variant={listening ? "destructive" : "outline"}
              size="icon"
              onClick={startMic}
              aria-label="Голосовой ввод"
              className="h-11 w-11"
            >
              <Mic className={cn("h-4 w-4", listening && "animate-pulse")} />
            </Button>
            <Button type="submit" disabled={busy || !input.trim()} className="h-11 gap-2">
              <Send className="h-4 w-4" /> Отправить
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
