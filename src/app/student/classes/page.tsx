"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, LogIn, MessagesSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";

type ClassItem = {
  id: string;
  name: string;
  grade: number;
  teacherId: string;
  joinCode: string;
  memberCount: number;
};

export default function StudentClassesPage() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/classes", { cache: "no-store" });
      const data = (await res.json()) as { classes?: ClassItem[] };
      setClasses(data.classes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void reload();
  }, [status, reload]);

  async function joinClass(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; group?: { name: string } };
      if (!res.ok || !data.ok) {
        setError(data.error || "Не удалось присоединиться");
        return;
      }
      setMessage(`Ты в классе «${data.group?.name}»!`);
      setCode("");
      await reload();
    } finally {
      setJoining(false);
    }
  }

  if (status === "loading") {
    return <div className="p-6 text-sm text-muted-foreground">Загрузка сессии…</div>;
  }
  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="mx-auto max-w-md p-10">
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-primary" />
            <h1 className="text-lg font-semibold">Войди, чтобы присоединиться к классу</h1>
            <p className="text-sm text-muted-foreground">
              Учитель даст тебе код класса из 6 символов — введёшь его после входа.
            </p>
            <Link href="/auth/signin?next=/student/classes" className="inline-flex">
              <Button className="gap-2"><LogIn className="h-4 w-4" /> Войти</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" /> Мои классы
        </h1>
        <p className="text-muted-foreground">
          Присоединись к своему классу по коду от учителя, чтобы получать домашние задания.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Присоединиться к классу</CardTitle>
          <CardDescription>Введи код, который прислал учитель (6 символов).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={joinClass} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Код класса</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-lg tracking-widest outline-none focus:border-primary"
                placeholder="ABC123"
              />
            </div>
            <Button type="submit" disabled={joining} className="gap-2">
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Присоединиться
            </Button>
          </form>
          {error ? <div className="mt-2 text-sm text-destructive">{error}</div> : null}
          {message ? <div className="mt-2 text-sm text-success">{message}</div> : null}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Ты пока не в одном классе. Введи код выше.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{c.memberCount} учеников</span>
                    </div>
                  </div>
                  <Badge variant="outline">{c.grade} кл</Badge>
                </div>
                <div className="flex justify-end">
                  <Link href={`/student/classes/${c.id}/chat`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <MessagesSquare className="h-3.5 w-3.5" /> Чат класса
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
