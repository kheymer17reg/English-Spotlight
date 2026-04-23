import Link from "next/link";
import { ArrowRight, BarChart3, BookOpenCheck, ClipboardCheck, FileText, Palette, Sparkles, Users, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRICULUM, GRADES } from "@/lib/curriculum";

export default function TeacherHome() {
  const counts = GRADES.map((g) => ({
    grade: g,
    modules: CURRICULUM.filter((m) => m.grade === g).length,
  }));

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
          badge="NEW"
        />
        <ToolCard
          href="/teacher/board"
          title="Онлайн-доска"
          desc="Ручка, фигуры, стикеры. Сохранение и PNG-экспорт."
          icon={Palette}
          tone="accent"
          badge="NEW"
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
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-accent/5">
          <CardHeader>
            <CardTitle>Шпаргалка по программе</CardTitle>
            <CardDescription>Сколько модулей в каждом классе</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-2 text-sm">
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
