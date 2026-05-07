"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Filter,
  Gamepad2,
  GraduationCap,
  Headphones,
  Languages,
  MessagesSquare,
  Search,
  Sparkles,
  Star,
  Target,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_LABELS,
  filterResources,
  RESOURCES,
  type Resource,
  type ResourceCategory,
} from "@/lib/resources";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<ResourceCategory, LucideIcon> = {
  listening: Headphones,
  reading: BookOpen,
  games: Gamepad2,
  video: Video,
  grammar: GraduationCap,
  vocabulary: Languages,
  exams: Target,
  dialogues: MessagesSquare,
};

const CATEGORY_TINT: Record<ResourceCategory, string> = {
  listening: "from-amber-500 to-orange-500",
  reading: "from-emerald-500 to-teal-500",
  games: "from-violet-500 to-fuchsia-500",
  video: "from-rose-500 to-pink-500",
  grammar: "from-sky-500 to-indigo-500",
  vocabulary: "from-violet-500 to-purple-500",
  exams: "from-slate-500 to-zinc-600",
  dialogues: "from-cyan-500 to-blue-500",
};

interface Props {
  /** Student grade (2-8); set to null for teacher view (all grades) */
  grade?: number | null;
  /** Extra hint shown in hero */
  audienceHint?: string;
}

export function ResourcesView({ grade, audienceHint }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ResourceCategory | null>(null);
  const [gradeFilter, setGradeFilter] = useState<number | null>(grade ?? null);

  const filtered = useMemo(
    () =>
      filterResources(RESOURCES, {
        grade: gradeFilter ?? undefined,
        categories: active ? [active] : undefined,
        query,
      }),
    [gradeFilter, active, query],
  );

  const featured = useMemo(
    () => filtered.filter((r) => r.featured).slice(0, 3),
    [filtered],
  );
  const rest = useMemo(
    () => filtered.filter((r) => !r.featured),
    [filtered],
  );

  const categories = Object.keys(CATEGORY_LABELS) as ResourceCategory[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="primary" className="mb-3 gap-1">
              <Sparkles className="h-3 w-3" /> {RESOURCES.length} проверенных ресурсов
            </Badge>
            <h1 className="font-display text-3xl font-semibold">
              Библиотека ресурсов
            </h1>
            <p className="mt-1.5 max-w-2xl text-muted-foreground">
              {audienceHint ??
                "Лучшие бесплатные сайты и каналы для практики: аудирование, игры, видео, экзамены. Всё проверено вручную."}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface/60 p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, описанию…"
            className="pl-9"
          />
        </div>
        {grade == null ? (
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Класс:
            </span>
            <button
              type="button"
              onClick={() => setGradeFilter(null)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                gradeFilter === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30",
              )}
            >
              все
            </button>
            {[2, 3, 4, 5, 6, 7, 8].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeFilter(g)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                  gradeFilter === g
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30",
                )}
              >
                {g}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <CategoryChip
          label="Все"
          icon={Filter}
          active={active === null}
          onClick={() => setActive(null)}
          tint="from-primary to-accent"
        />
        {categories.map((c) => (
          <CategoryChip
            key={c}
            label={CATEGORY_LABELS[c]}
            icon={CATEGORY_ICONS[c]}
            active={active === c}
            onClick={() => setActive((cur) => (cur === c ? null : c))}
            tint={CATEGORY_TINT[c]}
          />
        ))}
      </div>

      {/* Featured (only when no active filter narrowing) */}
      {featured.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            <h2 className="font-display text-lg font-semibold">
              Выбор редакции
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => (
              <ResourceCard key={r.id} resource={r} featured />
            ))}
          </div>
        </div>
      ) : null}

      {/* Rest */}
      {rest.length > 0 ? (
        <div className="space-y-3">
          {featured.length > 0 ? (
            <h2 className="font-display text-lg font-semibold">
              Все ресурсы
            </h2>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface/60 p-10 text-center text-sm text-muted-foreground">
          Ничего не нашлось. Попробуй сбросить фильтры.
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setActive(null);
                if (grade == null) setGradeFilter(null);
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CategoryChip({
  label,
  icon: Icon,
  active,
  onClick,
  tint,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  tint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-transparent bg-gradient-to-r text-white shadow-soft " + tint
          : "border-border bg-surface text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ResourceCard({
  resource,
  featured,
}: {
  resource: Resource;
  featured?: boolean;
}) {
  const primaryCategory = resource.categories[0];
  const Icon = CATEGORY_ICONS[primaryCategory];
  const tint = CATEGORY_TINT[primaryCategory];
  return (
    <Card
      className={cn(
        "group h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lifted",
        featured
          ? "border-primary/30 bg-gradient-to-br from-primary/5 via-surface to-accent/5"
          : "hover:border-primary/20",
      )}
    >
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "grid h-11 w-11 flex-none place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm",
              tint,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1">
            {featured ? (
              <Badge variant="warning" className="gap-1 text-[10px]">
                <Star className="h-2.5 w-2.5 fill-current" />
                TOP
              </Badge>
            ) : null}
            <Badge variant="outline" className="text-[10px]">
              {resource.grade[0] === resource.grade[1]
                ? `${resource.grade[0]} кл`
                : `${resource.grade[0]}-${resource.grade[1]} кл`}
            </Badge>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate font-semibold">{resource.title}</div>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {resource.source}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{resource.description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
          <div className="flex flex-wrap items-center gap-1">
            {resource.categories.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {CATEGORY_LABELS[c]}
              </span>
            ))}
          </div>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            Открыть
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
