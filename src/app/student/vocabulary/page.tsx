"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, RefreshCw, Shuffle, Sparkles, Volume2 } from "lucide-react";
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
import {
  deckStats,
  isDue,
  loadDeck,
  type SrCard,
  type SrQuality,
  upsertCard,
} from "@/lib/sr";

export default function VocabularyPage() {
  const student = useStore((s) => s.student);
  const words: VocabWord[] = useMemo(() => (student ? vocabularyByGrade(student.grade) : []), [student]);

  if (!student) return null;
  if (!words.length)
    return (
      <EmptyState
        title="Словарь пока пуст"
        description="Для этого класса ещё не добавлены слова в демо-данные."
      />
    );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Словарь</h1>
          <p className="text-muted-foreground">{student.grade} класс · {words.length} слов</p>
        </div>
      </div>
      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">Повторение</TabsTrigger>
          <TabsTrigger value="list">Просмотр</TabsTrigger>
          <TabsTrigger value="cards">Карточки</TabsTrigger>
          <TabsTrigger value="quiz">Квиз</TabsTrigger>
        </TabsList>
        <TabsContent value="review">
          <ReviewDeck words={words} studentId={student.id} grade={student.grade} />
        </TabsContent>
        <TabsContent value="list">
          <div className="grid gap-3 md:grid-cols-2">
            {words.map((w) => (
              <WordCard key={w.id} w={w} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="cards">
          <FlashCards words={words} />
        </TabsContent>
        <TabsContent value="quiz">
          <Quiz words={words} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WordCard({ w }: { w: VocabWord }) {
  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(w.word);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold">{w.word}</span>
            <Badge variant="outline" className="text-[10px]">{w.partOfSpeech}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">{w.translation}</div>
          <div className="mt-1 truncate text-xs italic text-muted-foreground">“{w.example}”</div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Произнести" onClick={speak}>
          <Volume2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function FlashCards({ words }: { words: VocabWord[] }) {
  const [order, setOrder] = useState(() => shuffle(words));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const addXp = useStore((s) => s.addXp);
  const w = order[idx];
  if (!w) return null;
  const next = () => {
    setFlipped(false);
    setIdx((i) => (i + 1) % order.length);
    addXp(2);
  };
  const reshuffle = () => {
    setOrder(shuffle(words));
    setIdx(0);
    setFlipped(false);
  };
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card className="overflow-hidden">
        <CardContent
          className="relative grid place-items-center p-10 text-center cursor-pointer select-none"
          onClick={() => setFlipped((f) => !f)}
        >
          <div className="absolute right-4 top-4">
            <Badge variant="primary">{idx + 1} / {order.length}</Badge>
          </div>
          {!flipped ? (
            <>
              <div className="text-4xl font-display font-semibold">{w.word}</div>
              <div className="mt-2 text-sm text-muted-foreground">Нажми, чтобы увидеть перевод</div>
            </>
          ) : (
            <>
              <div className="text-3xl font-display">{w.translation}</div>
              <div className="mt-2 text-sm text-muted-foreground italic">“{w.example}”</div>
            </>
          )}
        </CardContent>
      </Card>
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={reshuffle} className="gap-2">
          <Shuffle className="h-4 w-4" /> Перемешать
        </Button>
        <Button onClick={next} className="gap-2">
          Следующее <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Quiz({ words }: { words: VocabWord[] }) {
  const [pool] = useState(() => shuffle(words).slice(0, Math.min(10, words.length)));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctN, setCorrectN] = useState(0);
  const addXp = useStore((s) => s.addXp);
  const cur = pool[idx];
  const options = useMemo(() => {
    if (!cur) return [];
    const wrongs = shuffle(words.filter((w) => w.id !== cur.id)).slice(0, 3);
    return shuffle([cur, ...wrongs]).map((w) => w.translation);
  }, [cur, words]);

  if (!cur) return null;

  if (idx >= pool.length) {
    return (
      <EmptyState
        title={`Готово! ${correctN} / ${pool.length} правильных`}
        description="Хочешь потренироваться ещё? Перемешай карточки и попробуй снова."
        action={<Button onClick={() => location.reload()}>Заново</Button>}
      />
    );
  }

  const onPick = (t: string) => {
    if (picked) return;
    setPicked(t);
    if (t === cur.translation) {
      setCorrectN((c) => c + 1);
      addXp(5);
    }
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => i + 1);
    }, 700);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Как переводится?</CardTitle>
        <CardDescription>
          Вопрос {idx + 1} из {pool.length} · правильных {correctN}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-display font-semibold">{cur.word}</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((t) => {
            const state =
              picked == null
                ? "idle"
                : t === cur.translation
                  ? "correct"
                  : t === picked
                    ? "wrong"
                    : "idle";
            return (
              <button
                key={t}
                type="button"
                onClick={() => onPick(t)}
                className={cn(
                  "rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  state === "correct" && "border-success bg-success/10 text-success",
                  state === "wrong" && "border-destructive bg-destructive/10 text-destructive",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewDeck({
  words,
  studentId,
  grade,
}: {
  words: VocabWord[];
  studentId: string;
  grade: number;
}) {
  const addXp = useStore((s) => s.addXp);
  const [deck, setDeck] = useState<Record<string, SrCard>>({});
  const [version, setVersion] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    setDeck(loadDeck(studentId, grade));
  }, [studentId, grade]);

  const stats = useMemo(
    () => deckStats(deck, words.map((w) => w.id)),
    [deck, words],
  );

  const queue = useMemo(() => {
    return words.filter((w) => {
      const card = deck[w.id];
      if (!card) return true;
      return isDue(card);
    });
  }, [deck, words, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = queue[0];

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }, []);

  useEffect(() => {
    setShowTranslation(false);
  }, [current?.id]);

  const rate = (quality: SrQuality) => {
    if (!current) return;
    upsertCard(studentId, grade, current.id, quality);
    setDeck(loadDeck(studentId, grade));
    setVersion((v) => v + 1);
    setDoneCount((n) => n + 1);
    if (quality === "good") addXp(4);
    if (quality === "easy") addXp(6);
    if (quality === "hard") addXp(2);
  };

  if (!current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> На сегодня всё!
          </CardTitle>
          <CardDescription>
            Ты повторил все слова, которые надо было сегодня. Возвращайся завтра —
            SM-2 подберёт следующие карточки по твоему темпу.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatsGrid stats={stats} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <StatsGrid stats={stats} inline />
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <Badge variant="primary" className="gap-1">
              <Brain className="h-3 w-3" /> К повторению {stats.dueNow}
            </Badge>
            <CardDescription className="mt-1">
              За эту сессию: {doneCount}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" aria-label="Произнести" onClick={() => speak(current.word)}>
            <Volume2 className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <button
            type="button"
            onClick={() => setShowTranslation((v) => !v)}
            className="block w-full select-none rounded-xl bg-muted/40 p-8 text-center transition-colors hover:bg-muted/60"
          >
            <div className="text-4xl font-display font-semibold">{current.word}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              {current.partOfSpeech}
            </div>
            {showTranslation ? (
              <div className="mt-4 space-y-2">
                <div className="text-2xl font-medium text-primary">{current.translation}</div>
                <div className="text-sm italic text-muted-foreground">“{current.example}”</div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-muted-foreground">
                Нажми, чтобы увидеть перевод
              </div>
            )}
          </button>

          {showTranslation ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <RateButton label="Не знаю" hint="≤1 мин" tone="destructive" onClick={() => rate("again")} />
              <RateButton label="Трудно" hint="3 дня" tone="warning" onClick={() => rate("hard")} />
              <RateButton label="Нормально" hint="6 дней" tone="primary" onClick={() => rate("good")} />
              <RateButton label="Легко" hint="2 нед" tone="success" onClick={() => rate("easy")} />
            </div>
          ) : (
            <div className="text-center text-xs text-muted-foreground">
              Сначала попробуй вспомнить перевод — потом открой карточку и оцени себя.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RateButton({
  label,
  hint,
  tone,
  onClick,
}: {
  label: string;
  hint: string;
  tone: "destructive" | "warning" | "primary" | "success";
  onClick: () => void;
}) {
  const palette: Record<typeof tone, string> = {
    destructive: "border-destructive/50 text-destructive hover:bg-destructive/10",
    warning: "border-warning/50 text-warning hover:bg-warning/10",
    primary: "border-primary/50 text-primary hover:bg-primary/10",
    success: "border-success/50 text-success hover:bg-success/10",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-surface px-3 py-2 text-sm font-medium transition-colors",
        palette[tone],
      )}
    >
      <div>{label}</div>
      <div className="text-[10px] font-normal text-muted-foreground">{hint}</div>
    </button>
  );
}

function StatsGrid({
  stats,
  inline = false,
}: {
  stats: ReturnType<typeof deckStats>;
  inline?: boolean;
}) {
  const items = [
    { label: "К повторению", value: stats.dueNow, tone: "text-primary" },
    { label: "Новых", value: stats.untouched, tone: "text-muted-foreground" },
    { label: "Учу", value: stats.learning, tone: "text-warning" },
    { label: "Повторяю", value: stats.review, tone: "text-accent" },
    { label: "Освоено", value: stats.mastered, tone: "text-success" },
  ];
  return (
    <div className={cn("grid gap-2", inline ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-5")}>
      {items.map((it) => (
        <div key={it.label} className="rounded-lg border border-border bg-surface px-3 py-2">
          <div className={cn("text-lg font-display font-semibold", it.tone)}>{it.value}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
