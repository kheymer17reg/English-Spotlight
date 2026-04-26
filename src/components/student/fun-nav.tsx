"use client";

/**
 * Unified header for student "fun" pages: games, challenges, league.
 * Shared gradient hero + sibling tabs so the three feel like one section.
 */
import Link from "next/link";
import { Gamepad2, Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type FunSection = "games" | "challenges" | "league";

const SECTIONS: { id: FunSection; href: string; label: string; icon: typeof Trophy }[] = [
  { id: "games", href: "/student/games", label: "Игры", icon: Gamepad2 },
  { id: "challenges", href: "/student/challenges", label: "Челленджи", icon: Target },
  { id: "league", href: "/student/league", label: "Лига", icon: Trophy },
];

export function FunNavStrip({
  current,
  icon,
  title,
  subtitle,
}: {
  current: FunSection;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold leading-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1 text-xs">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = s.id === current;
            return (
              <Link
                key={s.id}
                href={s.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors",
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
