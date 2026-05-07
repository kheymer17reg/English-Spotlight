"use client";

/**
 * Сюжетки player. Walks through scenes one by one, with a quick interaction
 * (cloze / multiple-choice / translate) between scenes. On finish we POST
 * progress so XP is awarded server-side.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Volume2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SceneQuestion {
  type: "cloze" | "choice" | "translate";
  prompt: string;
  options?: string[];
  answer: string;
  hintRu?: string;
}
interface Scene {
  speaker?: string;
  text: string;
  question?: SceneQuestion;
}
interface StoryDetail {
  id: string;
  title: string;
  titleRu: string;
  emoji: string;
  grade: number;
  durationMin: number;
  summary: string;
  scenes: Scene[];
}

interface GlossPart {
  kind: "text" | "gloss";
  text: string;
  translation?: string;
}

function parseLine(text: string): GlossPart[] {
  const parts: GlossPart[] = [];
  const re = /\{([^|}]+)\|([^}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: "text", text: text.slice(last, m.index) });
    parts.push({ kind: "gloss", text: m[1], translation: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function plain(text: string): string {
  return text.replace(/\{([^|}]+)\|[^}]+\}/g, (_, w) => String(w));
}

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/[.!?,'"]+$/g, "").replace(/\s+/g, " ");
}

export default function StoryPlayerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [verdict, setVerdict] = useState<null | "ok" | "miss">(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finishedXp, setFinishedXp] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    fetch(`/api/stories/${params.id}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return (await r.json()) as { story: StoryDetail };
      })
      .then((b) => setStory(b.story))
      .catch(() => setError("История не найдена"));
  }, [params.id]);

  const scene = story?.scenes[step];
  const isLast = story ? step === story.scenes.length - 1 : false;

  const persist = useMemo(
    () => async (sceneIndex: number, finished: boolean, finalScore: { correct: number; total: number }) => {
      if (!story) return;
      try {
        const r = await fetch(`/api/stories/${story.id}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneIndex,
            correct: finalScore.correct,
            total: finalScore.total,
            finished,
          }),
        });
        if (finished && r.ok) {
          const body = (await r.json()) as { xpGained?: number };
          setFinishedXp(body.xpGained ?? 0);
        }
      } catch { /* ignore */ }
    },
    [story],
  );

  const check = () => {
    if (!scene?.question) return;
    const normalized = normalizeAnswer(answer);
    const correct = normalizeAnswer(scene.question.answer);
    const ok = normalized.length > 0 && (normalized === correct || normalized.includes(correct) || correct.includes(normalized));
    setVerdict(ok ? "ok" : "miss");
    setRevealed(true);
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  };

  const next = async () => {
    if (!story) return;
    setAnswer("");
    setVerdict(null);
    setRevealed(false);
    if (isLast) {
      await persist(story.scenes.length, true, {
        correct: score.correct,
        total: score.total,
      });
      setStep(step + 1);
      return;
    }
    const newStep = step + 1;
    setStep(newStep);
    void persist(newStep, false, score);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {error}. <Link href="/student/stories" className="underline">К списку</Link>
        </CardContent>
      </Card>
    );
  }
  if (!story) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Загружаем…</CardContent>
      </Card>
    );
  }

  // Final summary scene
  if (step >= story.scenes.length) {
    const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="overflow-hidden border-emerald-500/30">
          <div className="bg-gradient-to-br from-emerald-500/15 via-surface to-primary/15 p-6 text-center">
            <div className="text-5xl">{story.emoji}</div>
            <h1 className="mt-3 font-display text-2xl font-semibold">Готово!</h1>
            <div className="text-sm text-muted-foreground">{story.titleRu}</div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Badge variant="success" className="gap-1 px-3 py-1 text-base">
                {accuracy}%
              </Badge>
              <Badge variant="default" className="px-3 py-1 text-base">
                {score.correct}/{score.total} ответов
              </Badge>
              {finishedXp !== null ? (
                <Badge variant="primary" className="gap-1 px-3 py-1 text-base">
                  <Sparkles className="h-4 w-4" /> +{finishedXp} XP
                </Badge>
              ) : null}
            </div>
          </div>
          <CardContent className="flex flex-col gap-2 p-4 sm:flex-row">
            <Button onClick={() => router.push("/student/stories")} variant="outline" className="flex-1">
              Все сюжетки
            </Button>
            <Button
              onClick={() => {
                setStep(0);
                setScore({ correct: 0, total: 0 });
                setFinishedXp(null);
              }}
              className="flex-1"
            >
              Перечитать
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parts = scene ? parseLine(scene.text) : [];
  const fullPlain = scene ? plain(scene.text) : "";
  const progressPct = Math.round(((step + 0.5) / story.scenes.length) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-4" ref={tooltipRef as never}>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <Link href="/student/stories" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> К сюжеткам
        </Link>
        <span>
          Сцена {step + 1} из {story.scenes.length}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/8 via-surface to-accent/8 px-5 pt-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-2xl">{story.emoji}</span>
            <span className="font-display text-base font-semibold text-foreground">{story.title}</span>
          </div>
        </div>
        <CardContent className="space-y-4 p-5">
          {scene?.speaker ? (
            <div className="text-xs font-medium uppercase tracking-wide text-primary">
              {scene.speaker}
            </div>
          ) : null}
          <p className="text-lg leading-relaxed">
            {parts.map((p, i) =>
              p.kind === "text" ? (
                <span key={i}>{p.text}</span>
              ) : (
                <button
                  key={i}
                  type="button"
                  className="rounded bg-primary/10 px-1 text-primary underline decoration-dotted underline-offset-2 hover:bg-primary/20"
                  title={p.translation}
                  onClick={() => speak(p.text)}
                >
                  {p.text}
                </button>
              ),
            )}
          </p>
          <div>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => speak(fullPlain)}>
              <Volume2 className="h-3 w-3" /> Озвучить
            </Button>
          </div>

          {scene?.question ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" /> Вопрос
              </div>
              <div className="mb-3 text-sm">{scene.question.prompt}</div>
              {scene.question.type === "choice" && scene.question.options ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {scene.question.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        if (revealed) return;
                        setAnswer(opt);
                      }}
                      disabled={revealed}
                      className={cn(
                        "rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm transition-colors",
                        answer === opt && !revealed && "border-primary/60 bg-primary/10",
                        revealed && opt === scene.question!.answer && "border-emerald-500 bg-emerald-500/10",
                        revealed && answer === opt && opt !== scene.question!.answer && "border-rose-500 bg-rose-500/10",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <Input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={revealed}
                  placeholder={scene.question.type === "translate" ? "Напиши перевод" : "Впиши слово"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !revealed) check();
                  }}
                />
              )}
              {scene.question.hintRu && !revealed ? (
                <div className="mt-2 text-[11px] text-muted-foreground">подсказка: {scene.question.hintRu}</div>
              ) : null}
              {revealed ? (
                <div
                  className={cn(
                    "mt-3 rounded-lg px-3 py-2 text-sm",
                    verdict === "ok"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
                  )}
                >
                  {verdict === "ok" ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Верно!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Правильный ответ: <b>{scene.question.answer}</b>
                    </span>
                  )}
                </div>
              ) : null}

              <div className="mt-3 flex justify-end">
                {!revealed ? (
                  <Button onClick={check} disabled={!answer.trim()}>
                    Проверить
                  </Button>
                ) : (
                  <Button onClick={() => void next()} className="gap-1">
                    {isLast ? "Завершить" : "Дальше"} <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button onClick={() => void next()} className="gap-1">
                {isLast ? "Завершить" : "Дальше"} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
