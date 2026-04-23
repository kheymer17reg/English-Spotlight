"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Keyboard, RefreshCw, Shuffle, Sparkles, Timer, Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty";
import { useStore } from "@/lib/store";
import { vocabularyByGrade } from "@/lib/vocabulary";
import { shuffle } from "@/lib/utils";
import type { VocabWord } from "@/types";
import { cn } from "@/lib/utils";
import { computeBadges } from "@/lib/badges";

export default function GamesPage() {
  const student = useStore((s) => s.student);
  const words: VocabWord[] = useMemo(
    () => (student ? vocabularyByGrade(student.grade) : []),
    [student],
  );

  if (!student) return null;
  if (!words.length) return <EmptyState title="Пока нет слов для игр" />;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold">Игровой зал</h1>
        <p className="text-muted-foreground">
          Короткие раунды на словарь. Побеждают быстрые и внимательные — XP капает за каждую правильную пару.
        </p>
      </div>
      <StudentHud />
      <Tabs defaultValue="match">
        <TabsList>
          <TabsTrigger value="match">Match</TabsTrigger>
          <TabsTrigger value="type">Type-it</TabsTrigger>
          <TabsTrigger value="badges">Достижения</TabsTrigger>
        </TabsList>
        <TabsContent value="match">
          <MatchGame words={words} />
        </TabsContent>
        <TabsContent value="type">
          <TypeGame words={words} />
        </TabsContent>
        <TabsContent value="badges">
          <BadgesGrid />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StudentHud() {
  const student = useStore((s) => s.student);
  if (!student) return null;
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
      <HudTile label="XP" value={`${student.xp}`} icon={<Sparkles className="h-4 w-4 text-primary" />} />
      <HudTile label="Уровень" value={`${student.level}`} icon={<Trophy className="h-4 w-4 text-accent" />} />
      <HudTile label="Серия" value={`${student.streak} дн`} icon={<Timer className="h-4 w-4 text-warning" />} />
    </div>
  );
}

function HudTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2">
      <div>
        <div className="text-lg font-display font-semibold">{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
      {icon}
    </div>
  );
}

// ---------------- Match ----------------

type MatchCard = {
  key: string;       // unique id
  wordId: string;    // which pair
  side: "en" | "ru";
  text: string;
};

function makeMatchDeck(words: VocabWord[], n: number): MatchCard[] {
  const pool = shuffle(words).slice(0, n);
  const cards: MatchCard[] = [];
  for (const w of pool) {
    cards.push({ key: `${w.id}-en`, wordId: w.id, side: "en", text: w.word });
    cards.push({ key: `${w.id}-ru`, wordId: w.id, side: "ru", text: w.translation });
  }
  return shuffle(cards);
}

function MatchGame({ words }: { words: VocabWord[] }) {
  const addXp = useStore((s) => s.addXp);
  const PAIR_COUNT = Math.min(6, words.length);
  const [deck, setDeck] = useState<MatchCard[]>(() => makeMatchDeck(words, PAIR_COUNT));
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<MatchCard | null>(null);
  const [wrong, setWrong] = useState<[string, string] | null>(null);
  const [started] = useState(() => Date.now());
  const [finishedMs, setFinishedMs] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    if (solved.size === PAIR_COUNT && finishedMs === null) {
      setFinishedMs(Date.now() - started);
      addXp(PAIR_COUNT * 5);
    }
  }, [solved, PAIR_COUNT, finishedMs, started, addXp]);

  const onClick = (c: MatchCard) => {
    if (solved.has(c.wordId)) return;
    if (wrong) return;
    if (!selected) {
      setSelected(c);
      return;
    }
    if (selected.key === c.key) {
      setSelected(null);
      return;
    }
    setAttempts((a) => a + 1);
    if (selected.wordId === c.wordId && selected.side !== c.side) {
      setSolved((s) => new Set(s).add(c.wordId));
      setSelected(null);
      setCorrect((n) => n + 1);
      return;
    }
    setWrong([selected.key, c.key]);
    setTimeout(() => {
      setWrong(null);
      setSelected(null);
    }, 600);
  };

  const restart = () => {
    setDeck(makeMatchDeck(words, PAIR_COUNT));
    setSolved(new Set());
    setSelected(null);
    setWrong(null);
    setFinishedMs(null);
    setAttempts(0);
    setCorrect(0);
  };

  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Match</CardTitle>
          <CardDescription>
            Соединяй английское слово с переводом. {PAIR_COUNT} пар за раунд.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={restart} className="gap-1">
          <Shuffle className="h-4 w-4" /> Новая партия
        </Button>
      </CardHeader>
      <CardContent>
        {finishedMs !== null ? (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-success/40 bg-success/10 px-4 py-3">
            <div>
              <div className="text-sm font-medium text-success">
                Готово за {(finishedMs / 1000).toFixed(1)} с · +{PAIR_COUNT * 5} XP
              </div>
              <div className="text-xs text-muted-foreground">
                Попаданий: {correct} / {attempts} ({accuracy}%)
              </div>
            </div>
            <Button size="sm" onClick={restart} className="gap-1">
              <RefreshCw className="h-4 w-4" /> Ещё раз
            </Button>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {deck.map((c) => {
            const isSolved = solved.has(c.wordId);
            const isSelected = selected?.key === c.key;
            const isWrong = wrong && (wrong[0] === c.key || wrong[1] === c.key);
            return (
              <button
                key={c.key}
                type="button"
                disabled={isSolved || Boolean(wrong)}
                onClick={() => onClick(c)}
                className={cn(
                  "group relative min-h-[64px] rounded-xl border-2 px-3 py-3 text-center text-sm transition-all",
                  isSolved
                    ? "border-transparent bg-success/10 text-muted-foreground opacity-40 line-through"
                    : isWrong
                      ? "animate-pulse border-destructive bg-destructive/10 text-destructive"
                      : isSelected
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border bg-surface hover:border-primary/40 hover:bg-muted",
                )}
              >
                <div className="absolute left-2 top-1 text-[9px] uppercase tracking-wider opacity-60">
                  {c.side === "en" ? "EN" : "RU"}
                </div>
                {c.text}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- Type-it ----------------

function normaliseAnswer(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
}

function TypeGame({ words }: { words: VocabWord[] }) {
  const addXp = useStore((s) => s.addXp);
  const ROUND = Math.min(8, words.length);
  const [queue, setQueue] = useState<VocabWord[]>(() => shuffle(words).slice(0, ROUND));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | "correct" | "wrong">(null);
  const [correctN, setCorrectN] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [idx]);

  const cur = queue[idx];
  const finished = idx >= queue.length;

  const restart = useCallback(() => {
    setQueue(shuffle(words).slice(0, ROUND));
    setIdx(0);
    setInput("");
    setResult(null);
    setCorrectN(0);
  }, [words, ROUND]);

  const submit = () => {
    if (!cur || result) return;
    const ok = normaliseAnswer(input) === normaliseAnswer(cur.word);
    setResult(ok ? "correct" : "wrong");
    if (ok) {
      setCorrectN((n) => n + 1);
      addXp(6);
    }
    setTimeout(() => {
      setIdx((i) => i + 1);
      setInput("");
      setResult(null);
    }, 900);
  };

  if (finished) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Раунд завершён</CardTitle>
          <CardDescription>Правильно: {correctN} / {ROUND} · +{correctN * 6} XP</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={restart} className="gap-1">
            <RefreshCw className="h-4 w-4" /> Новый раунд
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!cur) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" /> Type-it
          </CardTitle>
          <CardDescription>Впиши английское слово. {idx + 1} / {ROUND}</CardDescription>
        </div>
        <Badge variant="primary" className="gap-1"><Sparkles className="h-3 w-3" /> +6 XP</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/40 p-6 text-center">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Перевод</div>
          <div className="text-3xl font-display font-semibold">{cur.translation}</div>
          {cur.example ? (
            <div className="mt-2 text-xs italic text-muted-foreground">
              подсказка: “{cur.example.replace(new RegExp(cur.word, "gi"), "____")}”
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="введите слово по-английски…"
            disabled={Boolean(result)}
            className={cn(
              "flex-1 rounded-lg border bg-background px-3 py-2 text-base outline-none transition-colors",
              result === "correct" ? "border-success text-success"
              : result === "wrong" ? "border-destructive text-destructive"
              : "border-border focus:border-primary",
            )}
          />
          <Button onClick={submit} disabled={Boolean(result)}>Проверить</Button>
        </div>
        {result === "correct" ? (
          <div className="flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" /> Точно! +6 XP
          </div>
        ) : result === "wrong" ? (
          <div className="flex items-center gap-1 text-sm text-destructive">
            <X className="h-4 w-4" /> Правильно: <strong>{cur.word}</strong>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Нажми Enter, чтобы проверить.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- Badges ----------------

function BadgesGrid() {
  const student = useStore((s) => s.student);
  const badges = computeBadges(student);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((b) => (
        <Card
          key={b.id}
          className={cn(
            "overflow-hidden transition-all",
            b.unlocked ? "border-primary/50" : "opacity-70",
          )}
        >
          <CardContent className="flex items-start gap-3 p-4">
            <div
              className={cn(
                "grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl text-2xl",
                b.unlocked ? "bg-primary/10" : "bg-muted",
              )}
            >
              <span className={cn(!b.unlocked && "grayscale")}>{b.emoji}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold">{b.title}</div>
                {b.unlocked ? (
                  <Badge variant="success" className="text-[10px]">получено</Badge>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">{b.description}</div>
              {b.progress && !b.unlocked ? (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(b.progress.current / b.progress.target) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {b.progress.current} / {b.progress.target}
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
