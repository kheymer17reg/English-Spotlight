"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { data, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <div className="h-10 animate-pulse rounded-lg border border-dashed border-border" />
    );
  }

  if (!data?.user) {
    return (
      <Link
        href={`/auth/signin?next=${encodeURIComponent(pathname || "/")}`}
        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border p-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <LogIn className="h-4 w-4" /> Войти / Регистрация
      </Link>
    );
  }

  const roleLabel =
    data.user.role === "teacher"
      ? "Учитель"
      : data.user.role === "parent"
      ? "Родитель"
      : "Ученик";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2">
        <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
          {data.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.user.image} alt="" className="h-full w-full object-cover" />
          ) : (
            (data.user.name || data.user.email || "?").slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {data.user.name || data.user.email}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserRound className="h-3 w-3" />
            {roleLabel}
          </div>
        </div>
      </div>
      {!compact ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full gap-2"
        >
          <LogOut className="h-3.5 w-3.5" /> Выйти
        </Button>
      ) : null}
    </div>
  );
}
