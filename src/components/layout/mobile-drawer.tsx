"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";

export interface DrawerItem {
  href: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: string;
}

export interface DrawerSection {
  title?: string;
  items: DrawerItem[];
}

export function MobileDrawer({ sections }: { sections: DrawerSection[] }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close whenever route changes.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Меню"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <aside
            className="absolute inset-y-0 left-0 flex w-[82vw] max-w-[320px] flex-col border-r border-border bg-surface shadow-lifted"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 flex-none items-center justify-between px-4">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-3 pb-[env(safe-area-inset-bottom,1rem)]">
              {sections.map((section, si) => (
                <div key={section.title ?? `sec-${si}`} className="space-y-1">
                  {section.title ? (
                    <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                      {section.title}
                    </div>
                  ) : null}
                  {section.items.map((item) => {
                    const active = item.end
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
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
          </aside>
        </div>
      ) : null}
    </>
  );
}
