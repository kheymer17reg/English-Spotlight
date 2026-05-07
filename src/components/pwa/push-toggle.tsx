"use client";

/**
 * Toggle button for browser push notifications. Subscribes via the active
 * service worker, posts the subscription to /api/push/subscribe, and updates
 * server state on unsubscribe. Soft-fails when push isn't configured.
 */
import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = typeof window !== "undefined" ? window.atob(b64) : "";
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buf;
}

export function PushToggle({ compact = false }: { compact?: boolean }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [vapid, setVapid] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    try {
      const r = await fetch("/api/push/key", { cache: "no-store" });
      const body = (await r.json()) as { enabled: boolean; publicKey: string | null };
      if (!body.enabled || !body.publicKey) {
        setUnavailable("Push не настроен на сервере (нужны VAPID-ключи).");
        return;
      }
      setVapid(body.publicKey);
      setUnavailable(null);
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setEnabled(Boolean(sub));
    } catch {
      setUnavailable("Не удалось проверить статус уведомлений");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = async () => {
    if (!vapid) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setUnavailable("Разрешение на уведомления не выдано");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(vapid),
      });
      const json = sub.toJSON();
      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (!r.ok) {
        setUnavailable("Сервер отказал. Попробуй позже.");
        await sub.unsubscribe().catch(() => undefined);
        return;
      }
      setEnabled(true);
    } catch (err) {
      setUnavailable(err instanceof Error ? err.message : "Не удалось включить");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
    } catch (err) {
      setUnavailable(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return null;
  if (unavailable && !enabled) {
    return compact ? null : (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        {unavailable}
      </div>
    );
  }
  return (
    <Button
      variant={enabled ? "outline" : "primary"}
      size={compact ? "sm" : "md"}
      onClick={enabled ? disable : enable}
      disabled={busy || !vapid}
      className="gap-2"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : enabled ? (
        <BellOff className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {enabled ? "Уведомления включены" : "Включить уведомления"}
    </Button>
  );
}
