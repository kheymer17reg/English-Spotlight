"use client";

import { useEffect } from "react";

/**
 * Registers the Spotlight service worker once on app boot.
 * No visible UI — install prompt is handled by InstallAppButton separately.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Defer to idle so we don't compete with the first paint.
    const schedule = (cb: () => void) => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void })
        .requestIdleCallback;
      if (typeof ric === "function") ric(cb);
      else setTimeout(cb, 1500);
    };
    schedule(() => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Silent — offline capability degrades to network-only if SW blocked.
        });
    });
  }, []);
  return null;
}
