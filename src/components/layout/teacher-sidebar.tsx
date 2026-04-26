"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  ClipboardList,
  Compass,
  FileText,
  GraduationCap,
  Home,
  Inbox,
  Mic,
  Palette,
  Radio,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/auth/user-menu";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { PushToggle } from "@/components/pwa/push-toggle";

export const teacherNavItems: { href: string; label: string; icon: typeof Home; end?: boolean; badge?: string }[] = [
  { href: "/teacher", label: "Главная", icon: Home, end: true },
  { href: "/teacher/generate", label: "Генератор", icon: Wand2, badge: "AI" },
  { href: "/teacher/journal", label: "Журнал", icon: BookOpenCheck, badge: "NEW" },
  { href: "/teacher/classes", label: "Классы", icon: GraduationCap, badge: "NEW" },
  { href: "/teacher/homework", label: "Домашки", icon: ClipboardList, badge: "NEW" },
  { href: "/teacher/board", label: "Доска", icon: Palette, badge: "NEW" },
  { href: "/teacher/pronunciation", label: "Произношение", icon: Mic, badge: "NEW" },
  { href: "/teacher/quiz", label: "Live-квиз", icon: Radio, badge: "NEW" },
  { href: "/teacher/tests", label: "Тесты", icon: ClipboardCheck },
  { href: "/teacher/lessons", label: "Планы уроков", icon: FileText },
  { href: "/teacher/resources", label: "Библиотека", icon: Compass, badge: "NEW" },
  { href: "/teacher/students", label: "Ученики", icon: Users },
  { href: "/teacher/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/teacher/feedback", label: "Обратная связь", icon: Inbox },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface">
      <div className="flex h-16 items-center px-5">
        <Brand />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {teacherNavItems.map((item) => {
          const active = item.end ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
      <div className="space-y-3 border-t border-border p-4">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> ФГОС • 2025
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Готовые шаблоны тех. карт и тестов по программе Spotlight 2–8 класс
          </p>
        </div>
        <InstallAppButton className="w-full justify-center" />
        <div className="flex justify-center"><PushToggle compact /></div>
        <UserMenu />
      </div>
    </aside>
  );
}
