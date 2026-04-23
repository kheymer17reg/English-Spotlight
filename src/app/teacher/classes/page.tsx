"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Loader2, LogIn, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { GRADES } from "@/lib/curriculum";
import { useSession } from "next-auth/react";
import Link from "next/link";

type ClassItem = {
  id: string;
  name: string;
  grade: number;
  teacherId: string;
  joinCode: string;
  createdAt: string;
  memberCount: number;
};

type Member = {
  groupId: string;
  userId: string;
  role: "teacher" | "student";
  joinedAt: string;
  user: { id: string; email: string | null; name: string | null; image: string | null; role: "teacher" | "student" } | null;
};

export default function TeacherClassesPage() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(5);
  const [selected, setSelected] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/classes?scope=teacher", { cache: "no-store" });
      const data = (await res.json()) as { classes?: ClassItem[]; error?: string };
      setClasses(data.classes ?? []);
      if (data.classes && data.classes[0] && !selected) setSelected(data.classes[0].id);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const loadMembers = useCallback(async (id: string) => {
    const res = await fetch(`/api/classes/${id}`, { cache: "no-store" });
    const data = (await res.json()) as { members?: Member[]; error?: string };
    setMembers(data.members ?? []);
  }, []);

  useEffect(() => {
    if (status === "authenticated") void reload();
  }, [status, reload]);

  useEffect(() => {
    if (selected) void loadMembers(selected);
  }, [selected, loadMembers]);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), grade }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Не удалось создать класс");
        return;
      }
      setName("");
      await reload();
    } finally {
      setCreating(false);
    }
  }

  async function removeMember(userId: string) {
    if (!selected) return;
    await fetch(`/api/classes/${selected}?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    await loadMembers(selected);
    await reload();
  }

  if (status === "loading") {
    return (
      <div className="p-6 text-sm text-muted-foreground">Загрузка сессии…</div>
    );
  }
  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="mx-auto max-w-md p-10">
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-primary" />
            <h1 className="text-lg font-semibold">Войдите как учитель</h1>
            <p className="text-sm text-muted-foreground">
              Чтобы создавать классы и приглашать учеников, нужно зарегистрироваться как учитель.
            </p>
            <Link href="/auth/signin?next=/teacher/classes" className="inline-flex">
              <Button className="gap-2"><LogIn className="h-4 w-4" /> Войти</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (session.user.role !== "teacher") {
    return (
      <div className="mx-auto max-w-md p-10">
        <Card>
          <CardContent className="space-y-2 p-6 text-center">
            <h1 className="text-lg font-semibold">Нужна учительская роль</h1>
            <p className="text-sm text-muted-foreground">
              Зарегистрируй новый аккаунт и выбери роль «Учитель» — тогда сможешь создавать классы.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> Мои классы
          </h1>
          <p className="text-muted-foreground">
            Создай класс и поделись кодом — ученики введут его при регистрации и попадут к тебе.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Plus className="h-5 w-5" /> Новый класс</CardTitle>
          <CardDescription>Например, «5-А» или «Spotlight 5, утренняя группа».</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createClass} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Название</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Класс (параллель)</label>
              <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value))}>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g} класс</option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={creating} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Создать
            </Button>
          </form>
          {error ? <div className="mt-2 text-sm text-destructive">{error}</div> : null}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Пока нет ни одного класса. Создай первый выше.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-[260px_1fr]">
          <div className="space-y-2">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selected === c.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{c.name}</div>
                  <Badge variant="outline">{c.grade} кл</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{c.memberCount}</span>
                  <span className="ml-3 font-mono">код: {c.joinCode}</span>
                </div>
              </button>
            ))}
          </div>

          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {classes.find((c) => c.id === selected)?.name}
                  <Badge variant="primary">
                    код: <span className="ml-1 font-mono tracking-wider">{classes.find((c) => c.id === selected)?.joinCode}</span>
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Дай этот код ученикам — при регистрации выберут «Ученик» и введут код на странице «Мои классы».
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Пока никто не присоединился.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {members.map((m) => (
                      <li key={m.userId} className="flex items-center gap-3 py-2">
                        <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary/70 to-accent/70 text-xs font-semibold text-white">
                          {m.user?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.user.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (m.user?.name || m.user?.email || "?").slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{m.user?.name || m.user?.email || m.userId}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.user?.email} · {m.role === "teacher" ? "учитель" : "ученик"}
                          </div>
                        </div>
                        {m.role !== "teacher" ? (
                          <Button variant="ghost" size="sm" onClick={() => removeMember(m.userId)} className="gap-1 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" /> Убрать
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
