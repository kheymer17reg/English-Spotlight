"use client";

/**
 * UI for managing offline vocabulary packs:
 *  - "Save for offline" button — snapshots the current grade's word list
 *    into IndexedDB so it's available without network.
 *  - List of saved packs with progress (known / learning / due) and
 *    "Drill" / "Delete" actions.
 *  - Drill mode: minimal flashcard loop that records correct/incorrect
 *    review entirely client-side (no network calls). Results are merged
 *    back into the SR scheduler in `lib/offline-vocab.ts`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Cloud, CloudOff, Download, Loader2, Trash2, Volume2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SpeakButton } from "@/components/audio/speak-button";
import {
  deletePack,
  getPack,
  getProgress,
  listPacks,
  packStats,
  recordReview,
  savePack,
  selectDueWords,
  type PackStats,
  type VocabPack,
} from "@/lib/offline-vocab";
import type { Grade, VocabWord } from "@/types";
import { cn } from "@/lib/utils";

interface OfflineVocabPanelProps {
  grade: Grade;
  words: VocabWord[];
}

interface PackWithStats {
  pack: VocabPack;
  stats: PackStats;
}

export function OfflineVocabPanel({ grade, words }: OfflineVocabPanelProps) {
  const [packs, setPacks] = useState<PackWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drillId, setDrillId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  const refresh = useCallback(async () => {
    const list = await listPacks();
    const withStats = await Promise.all(
      list.map(async (pack) => ({ pack, stats: await packStats(pack) })),
    );
    setPacks(withStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [refresh]);

  const currentPackId = `grade-${grade}`;
  const currentPack = packs.find((p) => p.pack.id === currentPackId);
  const isFresh =
    currentPack && currentPack.pack.size === words.length && words.length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePack({
        id: currentPackId,
        label: `${grade} класс · все слова`,
        grade,
        words,
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить офлайн-пак? Прогресс по нему сохранится только если вы снова скачаете слова.")) return;
    await deletePack(id);
    if (drillId === id) setDrillId(null);
    await refresh();
  };

  if (drillId) {
    return (
      <DrillView
        packId={drillId}
        onClose={async () => {
          setDrillId(null);
          await refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl",
              online ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600",
            )}
          >
            {online ? <Cloud className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-sm font-semibold">
              {online ? "Сейчас онлайн" : "Сейчас оффлайн"}
            </div>
            <div className="text-xs text-muted-foreground">
              Скачай словарь — и его можно будет учить без интернета. Прогресс сохранится в браузере.
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isFresh ? "Обновить пак" : `Скачать ${words.length} слов`}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загружаем сохранённые паки…
        </div>
      ) : packs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Пока нет сохранённых паков. Нажми «Скачать», чтобы первый раз сохранить словарь
            прямо в браузер.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {packs.map(({ pack, stats }) => {
            const knownPct = pack.size ? Math.round((stats.known / pack.size) * 100) : 0;
            return (
              <Card key={pack.id} className="overflow-hidden">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{pack.label}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {pack.size} слов · сохранён {new Date(pack.savedAt).toLocaleString("ru-RU")}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                      onClick={() => void handleDelete(pack.id)}
                      aria-label="Удалить пак"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                      выучено {stats.known}
                    </Badge>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-600">
                      учу {stats.learning}
                    </Badge>
                    <Badge variant="outline" className="border-sky-500/30 text-sky-600">
                      новые {stats.newCount}
                    </Badge>
                    {stats.dueNow > 0 ? (
                      <Badge variant="primary" className="text-[10px]">
                        к повторению {stats.dueNow}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${knownPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] text-muted-foreground">
                      Знаю {knownPct}%
                    </div>
                    <Button size="sm" onClick={() => setDrillId(pack.id)}>
                      Учить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DrillViewProps {
  packId: string;
  onClose: () => void | Promise<void>;
}

function DrillView({ packId, onClose }: DrillViewProps) {
  const [pack, setPack] = useState<VocabPack | null>(null);
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getPack(packId);
      if (!p || cancelled) return;
      const progress = await getProgress(packId);
      const due = selectDueWords(p, progress, 12);
      setPack(p);
      setQueue(due.length ? due : p.words.slice(0, 12));
      setIdx(0);
      setFlipped(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [packId]);

  const card = queue[idx];
  const progressPct = useMemo(
    () => (queue.length ? Math.round(((idx + 1) / queue.length) * 100) : 0),
    [idx, queue.length],
  );

  const grade = async (correct: boolean) => {
    if (!card || !pack) return;
    await recordReview(pack.id, card.id, correct);
    setStats((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    if (idx + 1 >= queue.length) {
      // session done — let user see the summary screen.
      setIdx(queue.length);
      return;
    }
    setIdx((i) => i + 1);
    setFlipped(false);
  };

  if (!pack) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загружаем пак…
      </div>
    );
  }

  if (!card) {
    return (
      <div className="mx-auto max-w-md space-y-3 text-center">
        <div className="font-display text-2xl font-semibold">Готово 🎉</div>
        <div className="text-muted-foreground">
          Сегодня — {stats.correct} из {stats.total}. Прогресс сохранён в браузере, повторим
          оставшиеся завтра по расписанию.
        </div>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          <Button
            onClick={async () => {
              const progress = await getProgress(pack.id);
              const due = selectDueWords(pack, progress, 12);
              setQueue(due.length ? due : pack.words.slice(0, 12));
              setIdx(0);
              setStats({ correct: 0, total: 0 });
              setFlipped(false);
            }}
          >
            Ещё подход
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{pack.label}</span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted"
        >
          <X className="h-3 w-3" /> Выйти
        </button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <Card
        onClick={() => setFlipped((f) => !f)}
        className="relative min-h-[220px] cursor-pointer select-none overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-accent/5"
      >
        <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          {flipped ? (
            <>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {card.partOfSpeech}
              </div>
              <div className="font-display text-2xl font-semibold">{card.translation}</div>
              <div className="text-sm italic text-muted-foreground">«{card.example}»</div>
            </>
          ) : (
            <>
              <div className="font-display text-3xl font-semibold">{card.word}</div>
              {card.transcription ? (
                <div className="text-sm text-muted-foreground">[{card.transcription}]</div>
              ) : null}
              <SpeakButton text={card.word} className="mt-1" />
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Volume2 className="h-3 w-3" /> Нажми, чтобы перевернуть карточку
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2 border-rose-500/40 text-rose-600 hover:bg-rose-500/5"
          onClick={() => void grade(false)}
        >
          <X className="h-4 w-4" /> Не знаю
        </Button>
        <Button
          className="flex-1 gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
          onClick={() => void grade(true)}
        >
          <Check className="h-4 w-4" /> Знаю
        </Button>
      </div>
      <div className="text-center text-[11px] text-muted-foreground">
        {idx + 1} / {queue.length} · правильно {stats.correct} из {stats.total}
      </div>
    </div>
  );
}
