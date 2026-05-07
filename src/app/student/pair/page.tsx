"use client";

/**
 * Pair-roleplay lobby: pick a scenario to host, or enter a code to join.
 * Both flows lead to /student/pair/[code], which is the live chat view.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessagesSquare, Plus, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Scenario {
  id: string;
  title: string;
  description: string;
  roleA: string;
  roleB: string;
  minGrade: number;
}

interface RoomBrief {
  code: string;
}

export default function PairLobbyPage() {
  const router = useRouter();
  const student = useStore((s) => s.student);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/pair/scenarios", { cache: "force-cache" });
        if (!r.ok) return;
        const data = (await r.json()) as { scenarios: Scenario[] };
        if (!cancelled) setScenarios(data.scenarios ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onCreate = async (scenarioId: string) => {
    setCreatingId(scenarioId);
    setError(null);
    try {
      const r = await fetch("/api/pair/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, grade: student?.grade }),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string; room?: RoomBrief };
      if (!r.ok || !data.ok || !data.room) {
        setError(data.error ?? "Не удалось создать комнату");
        return;
      }
      router.push(`/student/pair/${data.room.code}`);
    } finally {
      setCreatingId(null);
    }
  };

  const onJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError("Введите код комнаты (5 знаков)");
      return;
    }
    setJoining(true);
    try {
      const r = await fetch("/api/pair/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string; room?: RoomBrief };
      if (!r.ok || !data.ok || !data.room) {
        setError(data.error ?? "Комната не найдена");
        return;
      }
      router.push(`/student/pair/${data.room.code}`);
    } finally {
      setJoining(false);
    }
  };

  const grade = student?.grade ?? 5;
  const visible = scenarios.filter((s) => s.minGrade <= grade);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Парный роль-плей</h1>
        <p className="text-muted-foreground">
          Зови одноклассника и поговорите по-английски. Lumos подсказывает после каждой реплики:
          одна короткая поправка, без срыва беседы.
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" /> Войти по коду
          </CardTitle>
          <CardDescription>
            Партнёр уже создал комнату? Введи 5-значный код, который он назовёт.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onJoin} className="flex flex-wrap items-center gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="AB23X"
              maxLength={6}
              className="w-32 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-base uppercase tracking-[0.25em] focus:border-primary focus:outline-none"
            />
            <Button type="submit" disabled={joining} className="gap-2">
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessagesSquare className="h-4 w-4" />}
              Подключиться
            </Button>
            {error ? <span className="text-sm text-rose-600">{error}</span> : null}
          </form>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Создать комнату</h2>
          <Badge variant="outline" className="gap-1 text-[11px]">
            <Sparkles className="h-3 w-3 text-primary" /> {grade} класс
          </Badge>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загружаем сценарии…
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((s) => (
              <Card key={s.id} className="overflow-hidden">
                <CardContent className="space-y-3 p-4">
                  <div className="space-y-1">
                    <div className="text-base font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      {s.roleA}
                    </span>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent-foreground">
                      {s.roleB}
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <Button
                      size="sm"
                      onClick={() => void onCreate(s.id)}
                      disabled={creatingId !== null}
                      className={cn(
                        "gap-2",
                        creatingId === s.id && "opacity-80",
                      )}
                    >
                      {creatingId === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Создать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Как это работает
          </div>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Один из вас создаёт комнату и получает 5-значный код.</li>
            <li>Второй вводит код у себя — комната становится «активной».</li>
            <li>Пишите по очереди по-английски. Lumos после каждой твоей реплики подскажет поправку (если есть).</li>
            <li>До 30 реплик за сессию. По окончании можно посмотреть свои ошибки и пройти ещё раз.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
