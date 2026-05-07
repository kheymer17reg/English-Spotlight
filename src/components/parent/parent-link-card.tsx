"use client";

/**
 * Card shown on the student profile that exposes a stable 6-character link
 * code. Parents type it on /parent to bind themselves and follow the child's
 * progress (read-only).
 */
import { useEffect, useState } from "react";
import { Copy, Check, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ParentLinkCard() {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/parent/link-code", { cache: "no-store" });
        if (!r.ok) {
          if (!cancelled) setCode(null);
          return;
        }
        const data = (await r.json()) as { code?: string };
        if (!cancelled) setCode(data.code ?? null);
      } catch {
        if (!cancelled) setCode(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — show static UI even if clipboard fails
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Код для родителя
        </CardTitle>
        <CardDescription>
          Покажи этот код родителю — он введёт его в своём кабинете и сможет видеть твои оценки,
          ачивки и прогресс. Только просмотр, ничего изменить нельзя.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Получаем код…
          </div>
        ) : code ? (
          <>
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 font-mono text-2xl font-bold tracking-[0.4em] text-primary">
              {code}
            </div>
            <Button onClick={onCopy} variant="outline" size="sm" className="gap-2">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Скопировано" : "Копировать"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Код стабильный — не меняется и не теряется. Если родитель уже привязан, можно
              отвязать его в его кабинете.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Код пока недоступен — попробуй обновить страницу через минуту.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
