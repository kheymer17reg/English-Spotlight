"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BookOpenCheck,
  Flame,
  GraduationCap,
  Home,
  LineChart,
  MessageCircle,
  MessagesSquare,
  Mic2,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

const items: { href: string; label: string; icon: typeof Home; end?: boolean; badge?: string }[] = [
  { href: "/student", label: "Главная", icon: Home, end: true },
  { href: "/student/chat", label: "Lumos AI", icon: Sparkles, badge: "AI" },
  { href: "/student/practice", label: "Тренировка", icon: GraduationCap },
  { href: "/student/vocabulary", label: "Словарь", icon: BookOpen },
  { href: "/student/reading", label: "Чтение", icon: MessageCircle },
  { href: "/student/dialogues", label: "Диалоги", icon: MessagesSquare, badge: "NEW" },
  { href: "/student/pronunciation", label: "Лингафон", icon: Mic2, badge: "NEW" },
  { href: "/student/journal", label: "Мой журнал", icon: BookOpenCheck, badge: "NEW" },
  { href: "/student/challenges", label: "Задания дня", icon: Flame },
  { href: "/student/progress", label: "Прогресс", icon: LineChart },
  { href: "/student/profile", label: "Профиль", icon: UserRound },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const student = useStore((s) => s.student);

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface">
      <div className="flex h-16 items-center px-5">
        <Brand />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const active = item.end ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.badge ? (
                <Badge variant="accent" className="text-[10px] uppercase tracking-wider">
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        {student ? (
          <Link
            href="/student/profile"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
              {student.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{student.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                Уровень {student.level} · {student.xp} XP
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/" className="block rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground hover:bg-muted">
            Войти как ученик
          </Link>
        )}
      </div>
    </aside>
  );
}
