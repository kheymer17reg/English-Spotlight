"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

/**
 * "Install app" button. Renders only when the browser emits the
 * `beforeinstallprompt` event (Chrome/Edge/Android; iOS users must
 * add to home screen manually — we show a hint there).
 */
export function InstallAppButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Already running as installed PWA?
    const mqStandalone = window.matchMedia?.("(display-mode: standalone)");
    const iosStandalone = (
      window.navigator as unknown as { standalone?: boolean }
    ).standalone;
    if (mqStandalone?.matches || iosStandalone) {
      setInstalled(true);
      return;
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setDeferred(null);
    }
  }

  if (installed) return null;
  if (!deferred) return null;

  return (
    <button
      type="button"
      onClick={install}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 px-3 py-2 text-xs font-medium text-primary transition-all hover:shadow-glow",
        className,
      )}
    >
      <Download className="h-3.5 w-3.5" />
      Установить приложение
    </button>
  );
}
