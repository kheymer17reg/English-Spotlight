"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BookOpenCheck,
  ClipboardList,
  Compass,
  Flame,
  Gamepad2,
  GraduationCap,
  Home,
  LineChart,
  MessageCircle,
  MessagesSquare,
  Mic,
  Mic2,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { UserMenu } from "@/components/auth/user-menu";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "Обзор",
    items: [
      { href: "/student", label: "Главная", icon: Home, end: true },
      { href: "/student/progress", label: "Прогресс", icon: LineChart },
    ],
  },
  {
    title: "Изучение",
    items: [
      { href: "/student/chat", label: "Lumos AI", icon: Sparkles, badge: "AI" },
      { href: "/student/practice", label: "Тренировка", icon: GraduationCap },
      { href: "/student/vocabulary", label: "Словарь", icon: BookOpen },
      { href: "/student/reading", label: "Чтение", icon: MessageCircle },
      { href: "/student/dialogues", label: "Диалоги", icon: MessagesSquare },
    ],
  },
  {
    title: "Говорение",
    items: [
      { href: "/student/pronunciation", label: "Лингафон", icon: Mic2 },
      { href: "/student/roleplay", label: "Ролевик", icon: Mic },
    ],
  },
  {
    title: "Школа",
    items: [
      { href: "/student/classes", label: "Мои классы", icon: GraduationCap },
      { href: "/student/homework", label: "Мои задания", icon: ClipboardList },
      { href: "/student/journal", label: "Мой журнал", icon: BookOpenCheck },
    ],
  },
  {
    title: "Мотивация",
    items: [
      { href: "/student/games", label: "Игровой зал", icon: Gamepad2 },
      { href: "/student/challenges", label: "Задания дня", icon: Flame },
      { href: "/student/mistakes", label: "Мои ошибки", icon: Target },
      { href: "/student/league", label: "Лига недели", icon: Trophy },
      { href: "/student/resources", label: "Библиотека", icon: Compass, badge: "NEW" },
    ],
  },
  {
    title: "Аккаунт",
    items: [
      { href: "/student/profile", label: "Профиль", icon: UserRound },
    ],
  },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const student = useStore((s) => s.student);

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface">
      <div className="flex h-16 items-center px-5">
        <Brand />
      </div>
      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = item.end ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-4 w-4 transition-transform",
                        active ? "scale-110" : "",
                      )}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.badge ? (
                    <Badge
                      variant={item.badge === "AI" ? "primary" : "accent"}
                      className="h-4 text-[9px] uppercase tracking-wider"
                    >
                      {item.badge}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="space-y-3 border-t border-border p-4">
        {student ? (
          <Link
            href="/student/profile"
            className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition-all hover:border-primary/20 hover:bg-primary/5"
          >
            <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white shadow-glow">
              {student.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{student.name}</div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Trophy className="h-3 w-3" /> Ур.{student.level}
                <span>·</span>
                <Sparkles className="h-3 w-3 text-primary" /> {student.xp} XP
                {student.streak > 0 ? (
                  <>
                    <span>·</span>
                    <Flame className="h-3 w-3 text-orange-500" /> {student.streak}
                  </>
                ) : null}
              </div>
            </div>
          </Link>
        ) : null}
        <UserMenu />
      </div>
    </aside>
  );
}
