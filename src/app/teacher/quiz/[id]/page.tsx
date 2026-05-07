"use client";

/**
 * Teacher live-quiz host view: big PIN for projection, lobby with joining
 * players, current question + answer distribution, leaderboard, manual
 * "Next question" / "End" controls. Live updates via SSE.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { ChevronRight, Loader2, Play, Square, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HostState {
  session: {
    id: string;
    pin: string;
    title: string;
    grade: number;
    status: "lobby" | "active" | "finished";
    currentIdx: number;
    questionStartedAt: string | null;
    total: number;
  };
  currentQuestion: { prompt: string; options: string[]; answer: string } | null;
  players: { userId: string; name: string; score: number }[];
  answered: number;
  stats: { option: string; count: number }[];
}

export default function TeacherQuizHostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const [state, setState] = useState<HostState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // URL students will land on (with PIN pre-filled). Falls back to relative
  // path if window is not yet available.
  const joinUrl = useMemo(() => {
    if (!state?.session.pin) return null;
    if (typeof window === "undefined") return `/student/quiz?pin=${state.session.pin}`;
    return `${window.location.origin}/student/quiz?pin=${state.session.pin}`;
  }, [state?.session.pin]);

  // Generate QR for the join URL whenever the PIN changes.
  useEffect(() => {
    if (!joinUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(joinUrl, { width: 240, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/quiz/host/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Не удалось загрузить квиз");
        return;
      }
      const body = (await r.json()) as HostState;
      setState(body);
      setError(null);
    } catch {
      setError("Сеть недоступна");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id) return;
    const url = `/api/quiz/${encodeURIComponent(id)}/stream`;
    const es = new EventSource(url, { withCredentials: true });
    const refresh = () => void load();
    es.addEventListener("player.joined", refresh as EventListener);
    es.addEventListener("player.left", refresh as EventListener);
    es.addEventListener("player.answered", refresh as EventListener);
    es.addEventListener("question.advanced", refresh as EventListener);
    es.addEventListener("session.finished", refresh as EventListener);
    return () => es.close();
  }, [id, load]);

  const action = async (a: "start" | "next" | "end") => {
    setBusy(true);
    try {
      await fetch(`/api/quiz/host/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: a }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {error ? <span className="text-rose-600">{error}</span> : (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загружаем…</>
        )}
      </div>
    );
  }

  const { session, currentQuestion, players, answered } = state;
  const isLobby = session.status === "lobby";
  const isActive = session.status === "active";
  const isFinished = session.status === "finished";
  const top = [...players].sort((a, b) => b.score - a.score);
  const totalAnswers = state.stats.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">{session.title}</h1>
          <p className="text-sm text-muted-foreground">
            {session.grade} класс ·{" "}
            {isFinished ? "Завершён"
              : isActive ? `Вопрос ${session.currentIdx + 1} из ${session.total}`
              : "Ожидание"}
          </p>
        </div>
        <div className="flex gap-2">
          {isLobby ? (
            <Button onClick={() => action("start")} disabled={busy || players.length === 0} className="gap-2">
              <Play className="h-4 w-4" /> Старт
            </Button>
          ) : null}
          {isActive ? (
            <>
              <Button onClick={() => action("next")} disabled={busy} className="gap-2">
                <ChevronRight className="h-4 w-4" />
                {session.currentIdx + 1 >= session.total ? "Финиш" : "Следующий"}
              </Button>
              <Button onClick={() => action("end")} disabled={busy} variant="outline" className="gap-2">
                <Square className="h-4 w-4" /> Завершить
              </Button>
            </>
          ) : null}
          {isFinished ? (
            <Button variant="outline" onClick={() => router.push("/teacher/quiz")}>К списку</Button>
          ) : null}
        </div>
      </div>

      {isLobby ? (
        <Card className="overflow-hidden border-primary/20">
          <CardContent className="p-6">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div className="space-y-3 text-center md:text-left">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Покажи код классу</div>
                <div className="font-display text-7xl font-bold tracking-[0.2em] text-primary md:text-8xl">
                  {session.pin}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    Способ 1 · вручную: открыть{" "}
                    <span className="font-medium text-foreground">/student/quiz</span> → ввести PIN
                  </div>
                  <div>Способ 2 · отсканировать QR справа — попадёт сразу с заполненным PIN</div>
                </div>
                <div className="pt-2 text-sm">
                  Подключилось: <span className="font-semibold">{players.length}</span>
                </div>
                {players.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-1.5 pt-1 md:justify-start">
                    {players.map((p) => (
                      <Badge key={p.userId} variant="outline" className="text-xs">{p.name}</Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Ждём учеников…</div>
                )}
              </div>
              {qrDataUrl ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt={`QR-код для входа на квиз с PIN ${session.pin}`}
                    width={240}
                    height={240}
                    className="rounded-lg border border-border bg-white p-2 shadow-soft"
                  />
                  <div className="text-xs text-muted-foreground">Сканируй камерой телефона</div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isActive && currentQuestion ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Вопрос {session.currentIdx + 1} / {session.total}
              </div>
              <div className="mt-1 font-display text-4xl font-bold md:text-5xl">{currentQuestion.prompt}</div>
              <div className="mt-3 text-sm text-muted-foreground">
                Ответили: <span className="font-semibold text-foreground">{answered}</span> / {players.length}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {currentQuestion.options.map((opt) => {
                const stat = state.stats.find((s) => s.option === opt);
                const count = stat?.count ?? 0;
                const pct = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
                const isAnswer = opt === currentQuestion.answer;
                return (
                  <div
                    key={opt}
                    className={cn(
                      "relative overflow-hidden rounded-xl border p-3 text-sm transition-colors",
                      isAnswer && answered > 0
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-border bg-surface",
                    )}
                  >
                    <div
                      className="absolute inset-0 bg-primary/10 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between gap-2">
                      <span className="font-medium">{opt}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-amber-500" /> Лидерборд
          </div>
          {top.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Пока никого. PIN сверху — пусть подключаются.
            </div>
          ) : (
            <ol className="space-y-1.5">
              {top.map((p, i) => (
                <li
                  key={p.userId}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2",
                    i === 0 && "bg-amber-500/10",
                    i === 1 && "bg-muted/40",
                    i === 2 && "bg-orange-500/10",
                  )}
                >
                  <span className="w-6 text-center font-semibold text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 truncate font-medium">{p.name}</span>
                  <span className="font-mono font-semibold">{p.score}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
