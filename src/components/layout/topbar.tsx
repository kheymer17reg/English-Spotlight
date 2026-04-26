"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Flame, Star } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { Brand } from "@/components/layout/brand";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { studentNavSections } from "@/components/layout/sidebar";
import { teacherNavItems } from "@/components/layout/teacher-sidebar";

export function Topbar({ role }: { role: "student" | "teacher" | "parent" }) {
  const pathname = usePathname();
  const student = useStore((s) => s.student);
  const other = role === "student" ? "/teacher" : role === "teacher" ? "/" : "/student";
  const otherLabel =
    role === "student" ? "Кабинет учителя" : role === "teacher" ? "На главную" : "К ученику";
  const title = pathname === "/student" ? "Добро пожаловать" : undefined;
  const drawerSections =
    role === "student"
      ? studentNavSections
      : role === "teacher"
      ? [{ title: undefined, items: teacherNavItems }]
      : [];

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/70 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <MobileDrawer sections={drawerSections} />
          <div className="lg:hidden">
            <Brand compact />
          </div>
          {title ? (
            <h1 className="hidden text-base font-semibold lg:block">{title}</h1>
          ) : null}
        </div>
        <div className="flex flex-none items-center gap-1.5 sm:gap-2">
          {role === "student" && student ? (
            <>
              <Badge variant="warning" className="h-6 gap-1 px-2">
                <Flame className="h-3 w-3" /> {student.streak}
              </Badge>
              <Badge variant="primary" className="h-6 gap-1 px-2">
                <Star className="h-3 w-3" />
                <span>{student.xp}</span>
                <span className="hidden sm:inline"> XP</span>
              </Badge>
            </>
          ) : null}
          <Link href={other} className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden md:inline">{otherLabel}</span>
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
