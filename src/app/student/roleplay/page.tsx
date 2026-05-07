"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Cake,
  Calendar,
  CalendarDays,
  Home,
  Loader2,
  MapPin,
  Mic,
  Mic2,
  Palette,
  PawPrint,
  Plane,
  RefreshCw,
  School,
  ShoppingBag,
  StopCircle,
  Users,
  UtensilsCrossed,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { useStore } from "@/lib/store";
import { scenariosByGrade, SCENARIOS, type RoleplayScenario } from "@/lib/scenarios";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { logActivity } from "@/lib/activity-client";

const ICONS: Record<string, typeof Users> = {
  Users,
  Cake,
  School,
  UtensilsCrossed,
  PawPrint,
  Calendar,
  Home,
  MapPin,
  ShoppingBag,
  Palette,
  CalendarDays,
  Plane,
  Mic2,
};

export default function RoleplayPage() {
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const list = useMemo(() => {
    if (!student) return [];
    const primary = scenariosByGrade(student.grade);
    const others = SCENARIOS.filter((s) => s.grade !== student.grade);
    return [...primary, ...others];
  }, [student]);
  const [active, setActive] = useState<RoleplayScenario | null>(null);

  useEffect(() => {
    if (!active && list.length) setActive(list[0]);
  }, [list, active]);

  if (!student) return null;
  if (!list.length) return <EmptyState title="Сценарии появятся позже" />;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold">Разговорный ролевик</h1>
        <p className="text-muted-foreground">
          Говори с AI голосом — он будет вести роль, а ты свою. Тренируйся без страха ошибиться.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {list.map((s) => {
            const Icon = ICONS[s.icon] ?? Mic2;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                  active?.id === s.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface hover:bg-muted",
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                  active?.id === s.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">{s.title}</div>
                    <Badge variant="outline" className="text-[10px]">{s.grade}</Badge>
                  </div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">{s.description}</div>
                </div>
              </button>
            );
          })}
        </aside>
        {active ? (
          <RoleplayStage
            scenario={active}
            grade={student.grade}
            studentName={student.name}
            onSuccess={async () => {
              if (!student) return;
              const r = await logActivity({
                studentId: student.id,
                activityType: "roleplay",
                xp: 10,
                skill: "speaking",
                meta: { scenarioId: active?.id ?? "" },
              });
              if (r) updateStudent({ xp: r.xp, level: r.level, streak: r.streak });
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

type TurnState = "idle" | "thinking" | "speaking" | "listening";

function RoleplayStage({
  scenario,
  grade,
  studentName,
  onSuccess,
}: {
  scenario: RoleplayScenario;
  grade: number;
  studentName: string;
  onSuccess: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<TurnState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const supportsSR =
    typeof window !== "undefined" &&
    (("SpeechRecognition" in window) || ("webkitSpeechRecognition" in window));
  const listRef = useRef<HTMLDivElement | null>(null);

  // Reset when scenario changes
  useEffect(() => {
    setMessages([]);
    setError(null);
    setState("idle");
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [scenario.id]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, liveTranscript]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    setState("speaking");
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    window.speechSynthesis.speak(u);
  }, []);

  const fetchAiTurn = useCallback(
    async (history: ChatMessage[]) => {
      setState("thinking");
      setError(null);
      try {
        const res = await fetch("/api/ai/roleplay", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            grade,
            moduleNumber: scenario.moduleNumber,
            scenario: scenario.description,
            studentRole: scenario.studentRole,
            aiRole: scenario.aiRole,
            studentName,
            messages: history,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "AI error");
        const aiText = String(data.text || "").trim();
        if (!aiText) throw new Error("Пустой ответ AI");
        const nextMsgs: ChatMessage[] = [...history, { role: "assistant", content: aiText }];
        setMessages(nextMsgs);
        speak(aiText);
        return aiText;
      } catch (e: any) {
        setError(e?.message || "AI error");
        setState("idle");
        return null;
      }
    },
    [grade, scenario, speak, studentName],
  );

  const start = async () => {
    if (messages.length > 0) return;
    // Use scripted first turn immediately, and also ask AI for continuation when user speaks.
    const opener: ChatMessage = { role: "assistant", content: scenario.firstTurn };
    setMessages([opener]);
    speak(scenario.firstTurn);
  };

  const restart = () => {
    setMessages([]);
    setError(null);
    setLiveTranscript("");
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setState("idle");
  };

  const beginListen = () => {
    if (!supportsSR || state === "listening") return;
    const SR: any =
      (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    setLiveTranscript("");
    rec.onresult = (ev: any) => {
      let interim = "";
      let finalText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (finalText) setLiveTranscript((t) => (t + " " + finalText).trim());
      else setLiveTranscript(interim);
    };
    rec.onend = async () => {
      const said = liveTranscriptRef.current.trim();
      setState("idle");
      setLiveTranscript("");
      if (!said) return;
      const newHistory: ChatMessage[] = [...messages, { role: "user", content: said }];
      setMessages(newHistory);
      const aiText = await fetchAiTurn(newHistory);
      if (aiText) onSuccess();
    };
    rec.onerror = () => {
      setState("idle");
      setLiveTranscript("");
    };
    recognitionRef.current = rec;
    setState("listening");
    try {
      rec.start();
    } catch {
      setState("idle");
    }
  };

  const stopListen = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  };

  // Keep a ref in sync so the onend handler can read the latest transcript.
  const liveTranscriptRef = useRef("");
  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  const Icon = ICONS[scenario.icon] ?? Mic2;
  const canStart = messages.length === 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{scenario.title}</CardTitle>
              <CardDescription className="mt-1">
                <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">Ты: {scenario.studentRole}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">AI: {scenario.aiRole}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={restart} className="gap-1">
                <RefreshCw className="h-4 w-4" /> Заново
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!supportsSR ? (
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-xs text-warning-foreground">
            В этом браузере нет распознавания речи. Открой страницу в Chrome или Edge на компьютере — тогда можно будет говорить в микрофон.
          </div>
        ) : null}

        <div
          ref={listRef}
          className="h-80 space-y-3 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Mic2 className="h-6 w-6 opacity-50" />
              <div>Нажми «Начать», чтобы AI поздоровался и задал первый вопрос.</div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "assistant" ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                    m.role === "assistant"
                      ? "rounded-bl-sm border border-border bg-surface"
                      : "rounded-br-sm bg-primary text-primary-foreground",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {scenario.aiRole}
                      <button
                        type="button"
                        onClick={() => speak(m.content)}
                        className="rounded p-0.5 hover:bg-muted"
                        aria-label="Прослушать"
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : null}
                  {m.content}
                </div>
              </div>
            ))
          )}
          {state === "listening" && liveTranscript ? (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm border border-dashed border-primary/50 bg-primary/5 px-3 py-2 text-sm italic text-primary">
                {liveTranscript}
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {state === "thinking" ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> AI отвечает…</span>
            ) : state === "speaking" ? (
              <span className="flex items-center gap-1"><Volume2 className="h-3 w-3" /> AI говорит…</span>
            ) : state === "listening" ? (
              <span className="flex items-center gap-1 text-primary"><Mic className="h-3 w-3" /> слушаю…</span>
            ) : (
              <span>{messages.length === 0 ? "Сессия ещё не начата" : `Реплик: ${messages.length}`}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canStart ? (
              <Button onClick={start} className="gap-2">
                <Volume2 className="h-4 w-4" /> Начать
              </Button>
            ) : state === "listening" ? (
              <Button variant="destructive" onClick={stopListen} className="gap-2">
                <StopCircle className="h-4 w-4" /> Завершить реплику
              </Button>
            ) : (
              <Button
                onClick={beginListen}
                disabled={!supportsSR || state === "thinking" || state === "speaking"}
                className="gap-2"
              >
                <Mic className="h-4 w-4" /> Мой ход
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
