"use client";

/**
 * Avatar / frame / title customization. Items unlock automatically when the
 * student reaches the required level — no XP cost (XP is reputation, not
 * currency).
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface CatalogItem {
  id: string;
  kind: "avatar" | "frame" | "title";
  label: string;
  preview: string;
  requireLevel: number;
  unlocked: boolean;
}

interface Loadout {
  avatarId: string;
  frameId: string;
  titleId: string;
}

interface CosmeticsResponse {
  xp: number;
  level: number;
  loadout: Loadout;
  catalog: CatalogItem[];
}

const FRAME_PREFIX = "bg-gradient-to-tr ";

export default function CustomizePage() {
  const student = useStore((s) => s.student);
  const [data, setData] = useState<CosmeticsResponse | null>(null);
  const [tab, setTab] = useState<"avatar" | "frame" | "title">("avatar");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const r = await fetch("/api/cosmetics", { cache: "no-store" });
    if (!r.ok) return;
    setData((await r.json()) as CosmeticsResponse);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const indexed = useMemo(() => {
    if (!data) return null;
    const byId = new Map(data.catalog.map((c) => [c.id, c]));
    return {
      avatar: byId.get(data.loadout.avatarId) ?? null,
      frame: byId.get(data.loadout.frameId) ?? null,
      title: byId.get(data.loadout.titleId) ?? null,
      byId,
    };
  }, [data]);

  const equip = async (item: CatalogItem) => {
    if (!item.unlocked || busy) return;
    setBusy(true);
    setError(null);
    try {
      const key = item.kind === "avatar" ? "avatarId" : item.kind === "frame" ? "frameId" : "titleId";
      const r = await fetch("/api/cosmetics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: item.id }),
      });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Не удалось применить");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!data || !indexed) {
    return (
      <Card><CardContent className="p-6 text-sm text-muted-foreground">Загружаем…</CardContent></Card>
    );
  }

  const items = data.catalog.filter((c) => c.kind === tab);
  const initials = (student?.name ?? "U")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const avatarEmoji = indexed.avatar?.preview ?? "🙂";
  const frameClass = indexed.frame?.preview ?? "from-primary via-accent to-primary";
  const titleText = indexed.title?.preview ?? "";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/student/profile" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> К профилю
        </Link>
      </div>

      <Card className="overflow-hidden border-primary/20">
        <div className="flex flex-wrap items-center gap-4 bg-gradient-to-br from-primary/15 via-surface to-accent/15 p-5">
          <div className={cn("rounded-full p-[3px]", FRAME_PREFIX + frameClass)}>
            <div className="grid h-24 w-24 place-items-center rounded-full bg-surface text-4xl">
              {avatarEmoji !== "🙂" || data.loadout.avatarId !== "avatar-default"
                ? avatarEmoji
                : <span className="font-display text-2xl font-bold">{initials}</span>}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-2xl font-semibold">{student?.name ?? "Я"}</div>
            {titleText ? (
              <div className="mt-0.5 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {titleText}
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="primary" className="gap-1">
                <Sparkles className="h-3 w-3" /> Уровень {data.level}
              </Badge>
              <span>{data.xp} XP всего</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 text-sm">
        {(["avatar", "frame", "title"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 transition-colors",
              tab === k ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k === "avatar" ? "Аватары" : k === "frame" ? "Рамки" : "Титулы"}
          </button>
        ))}
      </div>

      {error ? <div className="text-xs text-rose-600">{error}</div> : null}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => {
          const equipped =
            (tab === "avatar" && data.loadout.avatarId === item.id) ||
            (tab === "frame" && data.loadout.frameId === item.id) ||
            (tab === "title" && data.loadout.titleId === item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={!item.unlocked || busy}
              onClick={() => void equip(item)}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl border bg-surface p-3 shadow-soft transition-all",
                item.unlocked ? "border-border hover:-translate-y-0.5 hover:border-primary/40" : "border-dashed border-border opacity-60",
                equipped && "border-primary ring-2 ring-primary/30",
              )}
            >
              {tab === "avatar" ? (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary/15 to-accent/15 text-4xl">
                  {item.preview}
                </div>
              ) : tab === "frame" ? (
                <div className={cn("rounded-full p-[3px]", FRAME_PREFIX + item.preview)}>
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-surface text-base text-muted-foreground">
                    Aa
                  </div>
                </div>
              ) : (
                <div className="grid h-16 w-full place-items-center rounded-lg bg-primary/5 px-2 text-center text-sm font-medium text-primary">
                  {item.preview || "—"}
                </div>
              )}
              <div className="text-center text-xs font-medium">{item.label}</div>
              {!item.unlocked ? (
                <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Lock className="h-3 w-3" /> Уровень {item.requireLevel}
                </div>
              ) : equipped ? (
                <div className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Надето
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground">Применить</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
