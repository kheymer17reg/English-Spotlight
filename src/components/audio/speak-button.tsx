"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "idle" | "loading" | "playing" | "paused";

interface Props {
  text: string;
  /** Override default voice (Orpheus English). Ignored by Web Speech fallback. */
  voice?: "troy" | "hannah" | "austin" | "mia" | "jon" | "mike";
  /** Language hint forwarded to server and used for Web Speech fallback. */
  lang?: "en" | "ru" | "en-US" | "ru-RU";
  /** One of: "icon" (default) or "chip" — chip is a slightly larger pill with text. */
  variant?: "icon" | "chip";
  /** Optional label for chip variant. */
  label?: string;
  className?: string;
  /** Preferred speech rate for Web Speech fallback. Default 0.95. */
  rate?: number;
}

/**
 * Speaks the given text via server-side Groq Orpheus TTS when available,
 * otherwise falls back to browser-native SpeechSynthesis. Single-instance:
 * clicking a different button cancels the currently playing one.
 */
export function SpeakButton({
  text,
  voice = "hannah",
  lang,
  variant = "icon",
  label,
  className,
  rate = 0.95,
}: Props) {
  const [mode, setMode] = useState<Mode>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAll() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utterRef.current = null;
  }

  async function play() {
    if (mode === "playing") {
      stopAll();
      setMode("idle");
      return;
    }
    setMode("loading");
    // Autodetect language if not supplied (cyrillic → ru, else en).
    const detected: "ru-RU" | "en-US" =
      lang === "ru" || lang === "ru-RU"
        ? "ru-RU"
        : lang === "en" || lang === "en-US"
          ? "en-US"
          : /[\u0400-\u04FF]/.test(text)
            ? "ru-RU"
            : "en-US";
    // Try server-side providers (Yandex for RU, Orpheus for EN)
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, lang: detected }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setMode("idle");
          stopAll();
        };
        audio.onerror = () => {
          setMode("idle");
          stopAll();
        };
        await audio.play();
        setMode("playing");
        return;
      }
    } catch {
      // fall through to Web Speech
    }
    // Fallback — Web Speech (browser). Uses the best available voice for lang.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = detected;
      u.rate = rate;
      u.onend = () => setMode("idle");
      u.onerror = () => setMode("idle");
      utterRef.current = u;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      setMode("playing");
      return;
    }
    setMode("idle");
  }

  const isIcon = variant === "icon";
  const Icon = mode === "loading" ? Loader2 : mode === "playing" ? Pause : Volume2;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        play();
      }}
      aria-label={mode === "playing" ? "Остановить" : "Озвучить"}
      className={cn(
        "inline-flex items-center gap-1.5 transition-all",
        isIcon
          ? "grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-muted-foreground hover:border-primary/30 hover:text-primary"
          : "h-8 rounded-full border border-border bg-surface px-3 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary",
        mode === "playing" && "border-primary/50 bg-primary/5 text-primary",
        className,
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          mode === "loading" && "animate-spin",
        )}
      />
      {!isIcon ? <span>{label ?? "Озвучить"}</span> : null}
    </button>
  );
}
