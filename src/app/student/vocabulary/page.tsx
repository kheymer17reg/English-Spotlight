"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Shuffle, Volume2 } from "lucide-react";
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
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Просмотр</TabsTrigger>
          <TabsTrigger value="cards">Карточки</TabsTrigger>
          <TabsTrigger value="quiz">Квиз</TabsTrigger>
        </TabsList>
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
