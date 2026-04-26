import Link from "next/link";
import { redirect } from "next/navigation";
import { Home, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=%2Fparent");
  }
  if (session.user.role !== "parent") {
    redirect(session.user.role === "teacher" ? "/teacher" : "/student");
  }
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-4">
          <Link href="/parent" className="inline-flex items-center gap-2">
            <Brand compact />
            <span className="hidden text-sm font-semibold sm:inline">Родителю</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/parent"
              className="hidden items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              <Home className="h-4 w-4" /> Дети
            </Link>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-6 sm:px-6">{children}</main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Родительский режим: только просмотр прогресса. <LogOut className="inline-block h-3 w-3" />{" "}
        чтобы выйти — меню профиля.
      </footer>
    </div>
  );
}
