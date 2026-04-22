"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Flame, Star } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

export function Topbar({ role }: { role: "student" | "teacher" }) {
  const pathname = usePathname();
  const student = useStore((s) => s.student);
  const other = role === "student" ? "/teacher" : "/";
  const otherLabel = role === "student" ? "Кабинет учителя" : "На главную";
  const title = pathname === "/student" ? "Добро пожаловать" : undefined;

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/70 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-3">
          {title ? <h1 className="text-base font-semibold">{title}</h1> : null}
        </div>
        <div className="flex items-center gap-2">
          {role === "student" && student ? (
            <>
              <Badge variant="warning" className="gap-1.5">
                <Flame className="h-3 w-3" /> {student.streak}
              </Badge>
              <Badge variant="primary" className="gap-1.5">
                <Star className="h-3 w-3" /> {student.xp} XP
              </Badge>
            </>
          ) : null}
          <Link href={other}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeftRight className="h-4 w-4" />
              {otherLabel}
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
