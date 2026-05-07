"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  ClipboardCheck,
  Flame,
  GraduationCap,
  Layers,
  MessagesSquare,
  Sparkles,
  Target,
  Users,
  Wand2,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useStore } from "@/lib/store";
import type { Grade } from "@/types";

export default function LandingPage() {
  const router = useRouter();
  const initStudent = useStore((s) => s.initStudent);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<Grade>(5);
  const [mode, setMode] = useState<null | "student" | "teacher">(null);

  const canSubmit = useMemo(() => name.trim().length >= 2, [name]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (mode === "student") {
      initStudent(name.trim(), grade);
      router.push("/student");
    } else {
      router.push("/teacher");
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-hero-gradient" />
      <div className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-50" />

      <header className="container flex h-16 items-center justify-between">
        <Brand />
        <div className="flex items-center gap-2">
          <Link href="#features" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
            Возможности
          </Link>
          <Link href="#how" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
            Как работает
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="container grid gap-12 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:py-24">
        <div>
          <Badge variant="primary" className="mb-6 gap-2 rounded-full py-1 pl-1.5 pr-3 text-xs">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3" />
            </span>
            AI-платформа для Spotlight 2–8
          </Badge>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Учить английский <span className="gradient-text">осмысленно</span>,<br />
            готовиться к уроку <span className="gradient-text">за 3 минуты</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Персональный AI-наставник для учеников и мощный генератор материалов для учителей.
            Упражнения, тесты, планы уроков, словарь, чтение и аналитика — всё по программе Spotlight.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => setMode("student")} className="gap-2">
              <GraduationCap className="h-4 w-4" /> Я ученик
            </Button>
            <Button size="lg" variant="outline" onClick={() => setMode("teacher")} className="gap-2">
              <Users className="h-4 w-4" /> Я учитель
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-warning" /> Ежедневные челленджи</span>
            <span className="inline-flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-primary" /> ФГОС тех. карты</span>
            <span className="inline-flex items-center gap-1.5"><Bot className="h-3.5 w-3.5 text-accent" /> Claude / GPT / Groq / Gemini</span>
          </div>
        </div>

        <Card className="relative overflow-hidden border-border/80 bg-surface/80 p-6 shadow-lifted backdrop-blur">
          {mode ? (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {mode === "student" ? "Начнём?" : "Кабинет учителя"}
                  </CardTitle>
                  <CardDescription>
                    {mode === "student"
                      ? "Представься — Lumos подстроится под твой класс"
                      : "Просто назови себя — и мы откроем инструменты"}
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Отмена
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Имя</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={mode === "student" ? "Например, Аня" : "Например, Мария Ивановна"}
                  autoFocus
                />
              </div>

              {mode === "student" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Класс</label>
                  <Select value={String(grade)} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>
                    {[2, 3, 4, 5, 6, 7, 8].map((g) => (
                      <option key={g} value={g}>{g} класс</option>
                    ))}
                  </Select>
                </div>
              ) : null}

              <Button size="lg" type="submit" disabled={!canSubmit} className="w-full gap-2">
                Продолжить <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Badge variant="accent">Что внутри</Badge>
                <span className="text-xs text-muted-foreground">Готовый современный ED-продукт</span>
              </div>
              <Feature icon={Wand2} title="Генератор упражнений" desc="Модуль → тип → сложность → количество. DOCX / TXT / копировать." />
              <Feature icon={ClipboardCheck} title="Тесты и контрольные" desc="Progress Check, модульный тест, формат ОГЭ." />
              <Feature icon={MessagesSquare} title="Lumos — AI-наставник" desc="Чат на Claude / GPT / Groq / Gemini с голосом." />
              <Feature icon={Layers} title="RAG по программе" desc="Знает темы, лексику и грамматику каждого модуля." />
            </div>
          )}
        </Card>
      </section>

      <section id="features" className="container py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-display font-semibold tracking-tight">Одна платформа — два кабинета</h2>
          <p className="mt-2 text-muted-foreground">Всё, что нужно и учителю, и ученику, без дополнительных сервисов.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <PanelCard
            role="teacher"
            title="Кабинет учителя"
            bullets={[
              "Генератор упражнений и контрольных за секунды",
              "Тех. карты уроков по ФГОС (цели, этапы, материалы)",
              "Список учеников, фильтры, топ-3 и отстающие",
              "Аналитика по навыкам: графики, тепловая карта",
              "Экспорт в DOCX, TXT, буфер обмена",
            ]}
          />
          <PanelCard
            role="student"
            title="Кабинет ученика"
            bullets={[
              "Lumos AI — чат с голосовым вводом",
              "Тренировка по текущему модулю с подсказками",
              "Словарь: просмотр, карточки (с переворотом), квиз",
              "Тексты для чтения с глоссарием и произношением",
              "Стрик, XP, уровни, бейджи, еженедельные цели",
            ]}
          />
        </div>
      </section>

      <section id="how" className="container py-16">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            { step: "1", title: "Выбери роль", text: "Учитель или ученик — минимальная регистрация." },
            { step: "2", title: "Запусти AI", text: "Добавь ключ любого провайдера в .env.local (Claude, GPT, Groq, Gemini)." },
            { step: "3", title: "Работай", text: "Генерируй уроки, учись, экспортируй — всё в современном интерфейсе." },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-border bg-surface p-6 shadow-soft">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                {s.step}
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-muted-foreground">
          <span>Сделано для уроков английского по учебнику Spotlight.</span>
          <span>Next.js · TypeScript · Tailwind · SQLite</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function PanelCard({ role, title, bullets }: { role: "teacher" | "student"; title: string; bullets: string[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <Badge variant={role === "teacher" ? "accent" : "primary"}>
            {role === "teacher" ? "Для учителя" : "Для ученика"}
          </Badge>
          <CardTitle className="mt-2">{title}</CardTitle>
        </div>
        <Link href={role === "teacher" ? "/teacher" : "/student"}>
          <Button variant="outline" size="sm" className="gap-1.5">
            Открыть <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-primary" /> {b}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
