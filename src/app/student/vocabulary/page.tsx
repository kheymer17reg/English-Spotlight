"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, Cloud, RefreshCw, Shuffle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty";
import { SpeakButton } from "@/components/audio/speak-button";
import { OfflineVocabPanel } from "@/components/vocab/offline-vocab-panel";
import { useStore } from "@/lib/store";
import { vocabularyByGrade } from "@/lib/vocabulary";
import { shuffle } from "@/lib/utils";
import type { Grade, VocabWord } from "@/types";
import { cn } from "@/lib/utils";
import { logActivity } from "@/lib/activity-client";
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Словарь</h1>
          <p className="text-muted-foreground">
            {student.grade} класс · <span className="font-semibold text-foreground">{words.length}</span> слов
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 rounded-lg bg-surface px-2 py-1">
            <Brain className="h-3 w-3 text-violet-500" /> SM-2
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-surface px-2 py-1">
            <Sparkles className="h-3 w-3 text-primary" /> XP за повторение
          </span>
        </div>
      </div>
      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">Повторение</TabsTrigger>
          <TabsTrigger value="list">Просмотр</TabsTrigger>
          <TabsTrigger value="cards">Карточки</TabsTrigger>
          <TabsTrigger value="quiz">Квиз</TabsTrigger>
          <TabsTrigger value="offline" className="gap-1">
            <Cloud className="h-3 w-3" /> Офлайн
          </TabsTrigger>
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
        <TabsContent value="offline">
          <OfflineVocabPanel grade={student.grade} words={words} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WordCard({ w }: { w: VocabWord }) {
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
        <SpeakButton text={w.word} />
      </CardContent>
    </Card>
  );
}

function FlashCards({ words }: { words: VocabWord[] }) {
  const [order, setOrder] = useState(() => shuffle(words));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const w = order[idx];
  if (!w) return null;
  const next = () => {
    setFlipped(false);
    setIdx((i) => (i + 1) % order.length);
    if (student) {
      void logActivity({
        studentId: student.id,
        activityType: "vocab_review",
        xp: 2,
        skill: "vocabulary",
      }).then((r) => {
        if (r) updateStudent({ xp: r.xp, level: r.level, streak: r.streak });
      });
    }
  };
  const reshuffle = () => {
    setOrder(shuffle(words));
    setIdx(0);
    setFlipped(false);
  };
  const progress = Math.round(((idx + 1) / order.length) * 100);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "relative min-h-[240px] cursor-pointer select-none overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-accent/5 transition-all",
          flipped ? "border-accent/30" : "hover:-translate-y-0.5 hover:shadow-lifted",
        )}
      >
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <CardContent className="grid min-h-[220px] place-items-center p-10 text-center">
          <div className="absolute right-4 top-4">
            <Badge variant="primary">
              {idx + 1} / {order.length}
            </Badge>
          </div>
          <div className="absolute left-4 top-4">
            <Badge variant="outline" className="text-[10px]">
              {w.partOfSpeech}
            </Badge>
          </div>
          {!flipped ? (
            <div className="animate-fade-in">
              <div className="font-display text-5xl font-semibold tracking-tight">
                {w.word}
              </div>
              <div
                className="mt-4 inline-flex"
                onClick={(e) => e.stopPropagation()}
              >
                <SpeakButton text={w.word} variant="chip" label="Прослушать" />
              </div>
              <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                тапни, чтобы перевернуть
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="font-display text-3xl text-primary">{w.translation}</div>
              <div className="mt-3 max-w-sm text-sm italic text-muted-foreground">
                “{w.example}”
              </div>
              <div
                className="mt-4 inline-flex"
                onClick={(e) => e.stopPropagation()}
              >
                <SpeakButton text={w.example} variant="chip" label="Прослушать пример" />
              </div>
            </div>
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
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
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
    const isRight = t === cur.translation;
    if (isRight) setCorrectN((c) => c + 1);
    if (student) {
      void logActivity({
        studentId: student.id,
        activityType: "vocab_review",
        xp: isRight ? 5 : 1,
        correct: isRight ? 1 : 0,
        total: 1,
        skill: "vocabulary",
        mistakes: isRight
          ? undefined
          : [
              {
                kind: "vocab",
                source: "vocab_drill",
                question: cur.word,
                correctAnswer: cur.translation,
                studentAnswer: t,
                wordId: cur.id,
                grade: (student.grade as number) as Grade,
              },
            ],
      }).then((r) => {
        if (r) updateStudent({ xp: r.xp, level: r.level, streak: r.streak });
      });
    }
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => i + 1);
    }, 700);
  };

  const progress = Math.round(((idx + 1) / pool.length) * 100);
  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Как переводится?</CardTitle>
            <CardDescription>
              Вопрос {idx + 1} из {pool.length}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1">
              {correctN} · верных
            </Badge>
            <Badge variant="outline" className="gap-1">
              {idx + 1} / {pool.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pb-6">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-accent/5 p-8 text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Слово
          </div>
          <div className="mt-1 font-display text-4xl font-semibold">{cur.word}</div>
        </div>
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
                disabled={picked != null}
                className={cn(
                  "group rounded-xl border bg-surface px-4 py-3 text-left text-sm font-medium transition-all",
                  state === "idle" && "border-border hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted hover:shadow-soft",
                  state === "correct" && "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  state === "wrong" && "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300",
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
  const storeStudent = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
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

  useEffect(() => {
    setShowTranslation(false);
  }, [current?.id]);

  const rate = (quality: SrQuality) => {
    if (!current) return;
    upsertCard(studentId, grade, current.id, quality);
    setDeck(loadDeck(studentId, grade));
    setVersion((v) => v + 1);
    setDoneCount((n) => n + 1);
    if (!storeStudent) return;
    const xpMap: Record<SrQuality, number> = { again: 1, hard: 2, good: 4, easy: 6 };
    const mistakes =
      quality === "again"
        ? [
            {
              kind: "vocab" as const,
              source: "vocab_drill" as const,
              question: current.word,
              correctAnswer: current.translation,
              wordId: current.id,
              grade: grade as Grade,
            },
          ]
        : undefined;
    void logActivity({
      studentId: storeStudent.id,
      activityType: "vocab_review",
      xp: xpMap[quality],
      correct: quality === "again" ? 0 : 1,
      total: 1,
      skill: "vocabulary",
      mistakes,
    }).then((r) => {
      if (r) updateStudent({ xp: r.xp, level: r.level, streak: r.streak });
    });
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
          <SpeakButton text={current.word} />
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <div className="flex justify-center">
            <SpeakButton text={current.example} variant="chip" label="Пример" />
          </div>
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
  const items: { label: string; value: number; tint: string; iconTint: string }[] = [
    { label: "К повторению", value: stats.dueNow, tint: "from-primary/10 to-accent/5", iconTint: "text-primary" },
    { label: "Новых", value: stats.untouched, tint: "from-muted/60 to-muted/20", iconTint: "text-muted-foreground" },
    { label: "Учу", value: stats.learning, tint: "from-amber-500/10 to-orange-500/5", iconTint: "text-amber-500" },
    { label: "Повторяю", value: stats.review, tint: "from-violet-500/10 to-fuchsia-500/5", iconTint: "text-violet-500" },
    { label: "Освоено", value: stats.mastered, tint: "from-emerald-500/10 to-teal-500/5", iconTint: "text-emerald-500" },
  ];
  return (
    <div className={cn("grid gap-2", inline ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-5")}>
      {items.map((it) => (
        <div
          key={it.label}
          className={cn(
            "rounded-xl border border-border/60 bg-gradient-to-br px-3 py-2.5",
            it.tint,
          )}
        >
          <div className={cn("font-display text-xl font-semibold tabular-nums", it.iconTint)}>
            {it.value}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}
