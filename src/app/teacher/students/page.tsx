"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, Search, Star, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { GRADES } from "@/lib/curriculum";
import type { StudentRecord } from "@/types";

export default function TeacherStudentsPage() {
  const [grade, setGrade] = useState<"all" | string>("all");
  const [q, setQ] = useState("");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (grade !== "all") params.set("grade", grade);
    if (q) params.set("q", q);
    setLoading(true);
    fetch(`/api/profile?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setStudents(d.students || []))
      .finally(() => setLoading(false));
  }, [grade, q]);

  const top3 = useMemo(() => [...students].slice(0, 3), [students]);
  const lagging = useMemo(
    () =>
      [...students]
        .filter((s) => s.xp < 120)
        .sort((a, b) => a.xp - b.xp)
        .slice(0, 3),
    [students],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">Ученики</h1>
        <p className="text-muted-foreground">Живой список с фильтром, поиском, топом и отстающими</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" /> Топ-3</CardTitle>
                <CardDescription>Лидеры по XP</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {top3.length ? top3.map((s, i) => (
              <StudentRow key={s.id} s={s} rank={i + 1} />
            )) : <EmptyRow label="Пока никого" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2"><Flame className="h-4 w-4 text-destructive" /> Отстающие</CardTitle>
                <CardDescription>Кому нужна помощь</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {lagging.length ? lagging.map((s, i) => (
              <StudentRow key={s.id} s={s} rank={i + 1} tone="warning" />
            )) : <EmptyRow label="Нет отстающих" />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени" className="pl-9" />
              </div>
              <Select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-40">
                <option value="all">Все классы</option>
                {GRADES.map((g) => <option key={g} value={g}>{g} класс</option>)}
              </Select>
            </div>
            <Badge variant="primary"><Users className="mr-1 h-3 w-3" /> {students.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Загрузка…</div>
          ) : students.length ? (
            students.map((s, i) => <StudentRow key={s.id} s={s} rank={i + 1} />)
          ) : (
            <EmptyRow label="По фильтру ничего нет" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentRow({ s, rank, tone }: { s: StudentRecord; rank: number; tone?: "warning" }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-full font-semibold text-white ${
          tone === "warning" ? "bg-gradient-to-br from-warning to-destructive" : "bg-gradient-to-br from-primary to-accent"
        }`}>
          {s.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-medium">{s.name}</div>
          <div className="text-xs text-muted-foreground">{s.grade} класс · Модуль {s.currentModule}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <Badge variant="warning" className="gap-1"><Flame className="h-3 w-3" /> {s.streak}</Badge>
        <Badge variant="primary" className="gap-1"><Star className="h-3 w-3" /> {s.xp} XP</Badge>
        <div className="w-8 text-right text-muted-foreground">#{rank}</div>
      </div>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <div className="py-3 text-center text-sm text-muted-foreground">{label}</div>;
}
