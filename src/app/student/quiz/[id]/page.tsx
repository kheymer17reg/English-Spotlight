"use client";

/**
 * Student quiz player view: lobby → live questions with countdown →
 * per-question feedback (correct/incorrect, points) → final leaderboard.
 * Live state via SSE.
 */
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, Trophy, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlayerState {
  session: {
    id: string;
    title: string;
    status: "lobby" | "active" | "finished";
    currentIdx: number;
    total: number;
  };
  currentQuestion: { qIdx: number; prompt: string; options: string[]; startedAt: string | null } | null;
  myAnswer: { answer: string; isCorrect: boolean; points: number } | null;
  players: { userId: string; name: string; score: number }[];
  me: { userId: string; name: string; score: number } | null;
}

const QUESTION_DURATION_MS = 25_000;

export default function StudentQuizPlayerPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [state, setState] = useState<PlayerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/quiz/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Квиз недоступен");
        return;
      }
      const body = (await r.json()) as PlayerState;
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
    const es = new EventSource(`/api/quiz/${encodeURIComponent(id)}/stream`, { withCredentials: true });
    const refresh = () => void load();
    es.addEventListener("question.advanced", refresh as EventListener);
    es.addEventListener("session.finished", refresh as EventListener);
    es.addEventListener("player.joined", refresh as EventListener);
    es.addEventListener("player.answered", refresh as EventListener);
    return () => es.close();
  }, [id, load]);

  // Tick for countdown.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const submit = async (answer: string) => {
    if (!state?.currentQuestion || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/quiz/${encodeURIComponent(id)}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qIdx: state.currentQuestion.qIdx, answer }),
      });
      await load();
    } finally {
      setSubmitting(false);
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

  const { session, currentQuestion, myAnswer, players, me } = state;
  const top = [...players].sort((a, b) => b.score - a.score);
  const myRank = me ? top.findIndex((p) => p.userId === me.userId) + 1 : null;
  const startedAt = currentQuestion?.startedAt ? new Date(currentQuestion.startedAt).getTime() : null;
  const remainingMs = startedAt !== null ? Math.max(0, QUESTION_DURATION_MS - (now - startedAt)) : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const remainingPct = startedAt !== null ? (remainingMs / QUESTION_DURATION_MS) * 100 : 0;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold">{session.title}</h1>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {session.status === "lobby" && "Ждём старта от учителя…"}
          {session.status === "active" && `Вопрос ${session.currentIdx + 1} из ${session.total}`}
          {session.status === "finished" && "Квиз завершён"}
        </div>
      </div>

      {session.status === "lobby" ? (
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground">
              Учитель сейчас стартует. Не выходи из вкладки.
            </div>
            <div className="text-xs text-muted-foreground">
              Подключилось: <span className="font-semibold">{players.length}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {session.status === "active" && currentQuestion ? (
        <>
          {startedAt !== null ? (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full transition-all",
                  remainingPct > 50 ? "bg-emerald-500" : remainingPct > 20 ? "bg-amber-500" : "bg-rose-500",
                )}
                style={{ width: `${remainingPct}%` }}
              />
            </div>
          ) : null}
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {remainingSec > 0 ? `${remainingSec}с` : "Время вышло"}
                </div>
                <div className="mt-1 font-display text-3xl font-bold">{currentQuestion.prompt}</div>
              </div>
              {myAnswer ? (
                <div
                  className={cn(
                    "rounded-xl border p-3 text-center",
                    myAnswer.isCorrect
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-rose-500/40 bg-rose-500/10",
                  )}
                >
                  <div className="flex items-center justify-center gap-2 font-semibold">
                    {myAnswer.isCorrect ? (
                      <><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Верно!</>
                    ) : (
                      <><XCircle className="h-5 w-5 text-rose-600" /> Не угадал</>
                    )}
                  </div>
                  <div className="mt-1 text-sm">
                    Твой ответ: <span className="font-medium">{myAnswer.answer}</span>
                  </div>
                  {myAnswer.points > 0 ? (
                    <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                      +{myAnswer.points} очков
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-2">
                  {currentQuestion.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={submitting || remainingMs <= 0}
                      onClick={() => void submit(opt)}
                      className="rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99] disabled:opacity-60"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {session.status === "finished" ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="text-center">
              <Trophy className="mx-auto h-10 w-10 text-amber-500" />
              <div className="mt-2 font-display text-xl font-semibold">Финиш!</div>
              {me ? (
                <div className="mt-1 text-sm text-muted-foreground">
                  Твой результат: <span className="font-semibold text-foreground">{me.score}</span> очков
                  {myRank ? <> · место {myRank} из {top.length}</> : null}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-amber-500" /> Лидерборд
          </div>
          <ol className="space-y-1">
            {top.map((p, i) => (
              <li
                key={p.userId}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                  me && p.userId === me.userId && "bg-primary/10 font-semibold",
                )}
              >
                <span className="w-5 text-center text-muted-foreground">{i + 1}</span>
                <span className="flex-1 truncate">{p.name}</span>
                <span className="font-mono">{p.score}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
