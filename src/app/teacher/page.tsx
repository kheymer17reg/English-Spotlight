"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  ClipboardCheck,
  Compass,
  FileText,
  Inbox,
  MessageSquareWarning,
  Palette,
  Sparkles,
  UserMinus,
  Users,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRICULUM, GRADES } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

type AlertsResponse = {
  overdueHomework: { id: string; title: string; grade: number; dueDate: string; pending: number }[];
  newFeedback: number;
  tomorrowLessons: { id: string; grade: number; topic: string; module: number }[];
  inactiveStudents: { id: string; name: string; grade: number }[];
};

export default function TeacherHome() {
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/teacher/alerts", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as AlertsResponse;
        if (!cancelled) setAlerts(data);
      } catch {
        // soft-fail; surface defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = GRADES.map((g) => ({
    grade: g,
    modules: CURRICULUM.filter((m) => m.grade === g).length,
  }));

  const overdueCount = alerts?.overdueHomework.reduce((acc, h) => acc + h.pending, 0) ?? 0;
  const tomorrowCount = alerts?.tomorrowLessons.length ?? 0;
  const feedbackCount = alerts?.newFeedback ?? 0;
  const inactiveCount = alerts?.inactiveStudents.length ?? 0;
  const anyAlert = overdueCount + tomorrowCount + feedbackCount + inactiveCount > 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-surface to-primary/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <Badge variant="accent" className="mb-3 gap-1">
              <Sparkles className="h-3 w-3" /> AI · ФГОС · Spotlight 2–8
            </Badge>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              Кабинет <span className="gradient-text">учителя</span>
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Быстрые инструменты подготовки: генерация заданий, тесты любого формата, планы уроков,
              список учеников и аналитика по навыкам.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link href="/teacher/generate">
                <Button size="lg" className="gap-2">
                  <Wand2 className="h-4 w-4" /> Создать упражнение
                </Button>
              </Link>
              <Link href="/teacher/lessons">
                <Button size="lg" variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" /> План урока
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts dashboard */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AlertCard
          tone="warning"
          icon={ClipboardCheck}
          title="Несдано ДЗ"
          value={overdueCount}
          hint={overdueCount > 0 ? "Учеников с просрочкой" : "Всё сдано вовремя"}
          href="/teacher/homework"
          loading={!alerts}
        />
        <AlertCard
          tone="primary"
          icon={CalendarClock}
          title="Уроков завтра"
          value={tomorrowCount}
          hint={tomorrowCount > 0 ? "Запланировано в журнале" : "На завтра ничего не запланировано"}
          href="/teacher/lessons"
          loading={!alerts}
        />
        <AlertCard
          tone="rose"
          icon={MessageSquareWarning}
          title="Новый feedback"
          value={feedbackCount}
          hint={feedbackCount > 0 ? "Не прочитано" : "Все ответы просмотрены"}
          href="/teacher/feedback"
          loading={!alerts}
        />
        <AlertCard
          tone="muted"
          icon={UserMinus}
          title="Без активности 7д"
          value={inactiveCount}
          hint={inactiveCount > 0 ? "Учеников отстают" : "Все ученики работают регулярно"}
          href="/teacher/students"
          loading={!alerts}
        />
      </div>

      {/* Alerts detail — only render if there is real data */}
      {anyAlert ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {(alerts?.overdueHomework.length ?? 0) > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Просроченные задания
                </CardTitle>
                <CardDescription>Кликни — откроется страница ДЗ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {alerts!.overdueHomework.map((h) => (
                  <Link
                    key={h.id}
                    href="/teacher/homework"
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:border-amber-500/40 hover:bg-amber-500/5"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="text-xs text-muted-foreground">{h.grade} кл.</span>{" "}
                      <span className="font-medium">{h.title}</span>
                    </span>
                    <Badge variant="warning" className="flex-none">
                      {h.pending}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {(alerts?.tomorrowLessons.length ?? 0) > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" /> Уроки завтра
                </CardTitle>
                <CardDescription>Готовы планы?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {alerts!.tomorrowLessons.map((l) => (
                  <Link
                    key={l.id}
                    href="/teacher/journal"
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="text-xs text-muted-foreground">
                        {l.grade} кл. · модуль {l.module}
                      </span>{" "}
                      <span className="font-medium">{l.topic}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 flex-none text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {(alerts?.inactiveStudents.length ?? 0) > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserMinus className="h-4 w-4 text-muted-foreground" /> Не были на платформе
                </CardTitle>
                <CardDescription>Никакой активности 7+ дней</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {alerts!.inactiveStudents.map((s) => (
                  <Link
                    key={s.id}
                    href="/teacher/students"
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:border-rose-500/40 hover:bg-rose-500/5"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="text-xs text-muted-foreground">{s.grade} кл.</span>{" "}
                      <span className="font-medium">{s.name}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 flex-none text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {feedbackCount > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-rose-500" /> Новый feedback
                </CardTitle>
                <CardDescription>Учеников и родителей</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/teacher/feedback"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:border-rose-500/40 hover:bg-rose-500/5"
                >
                  <span>
                    <span className="font-semibold">{feedbackCount}</span>{" "}
                    {pluralize(feedbackCount, ["сообщение", "сообщения", "сообщений"])} ждут ответа
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Tools grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <ToolCard
          href="/teacher/generate"
          title="Генератор"
          desc="Упражнения по модулю, типу и сложности. Экспорт DOCX/TXT."
          icon={Wand2}
          tone="primary"
        />
        <ToolCard
          href="/teacher/journal"
          title="Журнал"
          desc="Оценки 2-5, посещаемость, комментарии. Экспорт CSV."
          icon={BookOpenCheck}
          tone="success"
        />
        <ToolCard
          href="/teacher/board"
          title="Онлайн-доска"
          desc="tldraw: бесконечный холст, фигуры, стикеры, PNG."
          icon={Palette}
          tone="accent"
        />
        <ToolCard
          href="/teacher/tests"
          title="Тесты"
          desc="Progress Check · Модульный · ОГЭ-формат."
          icon={ClipboardCheck}
          tone="accent"
        />
        <ToolCard
          href="/teacher/lessons"
          title="Планы уроков"
          desc="Готовые тех. карты по ФГОС за 30 секунд."
          icon={FileText}
          tone="success"
        />
        <ToolCard
          href="/teacher/students"
          title="Ученики"
          desc="Список, поиск, фильтры, топ-3 и отстающие."
          icon={Users}
          tone="warning"
        />
        <ToolCard
          href="/teacher/analytics"
          title="Аналитика"
          desc="Графики навыков, тепловая карта, активность."
          icon={BarChart3}
          tone="primary"
        />
        <ToolCard
          href="/teacher/resources"
          title="Библиотека"
          desc="30+ проверенных сайтов: аудио, игры, видео, экзамены."
          icon={Compass}
          tone="accent"
        />
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-accent/5">
          <CardHeader>
            <CardTitle>Шпаргалка по программе</CardTitle>
            <CardDescription>Сколько модулей в каждом классе</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-4">
            {counts.map((c) => (
              <div
                key={c.grade}
                className="rounded-xl border border-border bg-surface/70 p-2.5 text-center transition-all hover:border-primary/30"
              >
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.grade} кл.</div>
                <div className="font-display text-xl font-semibold text-primary">{c.modules}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

function AlertCard({
  tone,
  icon: Icon,
  title,
  value,
  hint,
  href,
  loading,
}: {
  tone: "warning" | "primary" | "rose" | "muted";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  hint: string;
  href: string;
  loading: boolean;
}) {
  const isAlert = !loading && value > 0;
  const tones: Record<typeof tone, { wrapper: string; iconBg: string; valueColor: string }> = {
    warning: {
      wrapper: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60",
      iconBg: "bg-amber-500/15 text-amber-600",
      valueColor: "text-amber-600",
    },
    primary: {
      wrapper: "border-primary/30 bg-primary/5 hover:border-primary/60",
      iconBg: "bg-primary/15 text-primary",
      valueColor: "text-primary",
    },
    rose: {
      wrapper: "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60",
      iconBg: "bg-rose-500/15 text-rose-600",
      valueColor: "text-rose-600",
    },
    muted: {
      wrapper: "border-border bg-muted/40 hover:border-muted-foreground/30",
      iconBg: "bg-muted text-muted-foreground",
      valueColor: "text-foreground",
    },
  };
  const t = tones[tone];
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border p-4 transition-all hover:-translate-y-0.5",
        isAlert ? t.wrapper : "border-border bg-surface hover:border-primary/30",
      )}
    >
      <span className={cn("grid h-10 w-10 flex-none place-items-center rounded-lg", t.iconBg)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
        <div
          className={cn(
            "font-display text-2xl font-semibold tabular-nums",
            isAlert ? t.valueColor : "text-foreground",
          )}
        >
          {loading ? "…" : value}
        </div>
        <div className="line-clamp-1 text-xs text-muted-foreground">{hint}</div>
      </div>
    </Link>
  );
}

function ToolCard({
  href,
  title,
  desc,
  icon: Icon,
  tone,
  badge,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "accent" | "success" | "warning";
  badge?: string;
}) {
  const toneCls = {
    primary: "from-primary to-accent",
    accent: "from-accent to-primary",
    success: "from-emerald-500 to-teal-500",
    warning: "from-amber-500 to-orange-500",
  }[tone];
  const hoverBorder = {
    primary: "group-hover:border-primary/40",
    accent: "group-hover:border-accent/40",
    success: "group-hover:border-emerald-500/40",
    warning: "group-hover:border-amber-500/40",
  }[tone];
  return (
    <Link href={href} className="group">
      <Card
        className={`h-full border transition-all group-hover:-translate-y-0.5 group-hover:shadow-lifted ${hoverBorder}`}
      >
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${toneCls}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            {badge ? (
              <Badge variant="accent" className="text-[10px] uppercase tracking-wider">
                {badge}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-base font-semibold">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
