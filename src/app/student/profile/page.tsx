"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import type { Grade } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const reset = useStore((s) => s.reset);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  const [name, setName] = useState(student?.name ?? "");
  const [grade, setGrade] = useState<Grade>(student?.grade ?? 5);

  if (!student) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">Профиль</h1>
        <p className="text-muted-foreground">Твои настройки и данные</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Данные ученика</CardTitle>
          <CardDescription>Используются для подбора программы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Имя</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Класс</label>
            <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>
              {[2, 3, 4, 5, 6, 7, 8].map((g) => (
                <option key={g} value={g}>{g} класс</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary">XP {student.xp}</Badge>
              <Badge variant="warning">Стрик {student.streak}</Badge>
              <Badge variant="accent">Уровень {student.level}</Badge>
            </div>
            <Button onClick={() => updateStudent({ name, grade })}>Сохранить</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Тема оформления</CardTitle>
          <CardDescription>Светлая или тёмная</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="inline-flex rounded-lg border border-border p-1">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${theme === "light" ? "bg-surface shadow-soft" : "text-muted-foreground"}`}
            >
              <Sun className="h-3.5 w-3.5" /> Светлая
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${theme === "dark" ? "bg-surface shadow-soft" : "text-muted-foreground"}`}
            >
              <Moon className="h-3.5 w-3.5" /> Тёмная
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Сброс</CardTitle>
          <CardDescription>Удалить данные и выйти из кабинета</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              reset();
              router.push("/");
            }}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Сбросить профиль
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
