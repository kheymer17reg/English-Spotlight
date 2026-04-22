"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Flame, GraduationCap, Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/student", icon: Home, label: "Главная" },
  { href: "/student/chat", icon: Sparkles, label: "Lumos" },
  { href: "/student/practice", icon: GraduationCap, label: "Тренировка" },
  { href: "/student/vocabulary", icon: BookOpen, label: "Словарь" },
  { href: "/student/challenges", icon: Flame, label: "Задания" },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 gap-0.5 border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom,0.5rem)] pt-1 backdrop-blur-md lg:hidden">
      {items.map((item) => {
        const active = item.href === "/student" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-md py-2 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
