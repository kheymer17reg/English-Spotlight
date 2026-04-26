"use client";

/**
 * Student quiz join: enter the 6-digit PIN from the teacher's screen.
 * On success, redirects to the player view.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function StudentQuizJoinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/quiz/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const body = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        sessionId?: string;
        error?: string;
      };
      if (!r.ok || !body.ok || !body.sessionId) {
        setError(body.error ?? "Не получилось войти");
        return;
      }
      router.push(`/student/quiz/${body.sessionId}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-tight">Live-квиз</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Введи 6-значный PIN с экрана учителя.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={onJoin} className="space-y-3">
            <Input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              pattern="\d{6}"
              placeholder="000000"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-14 text-center font-display text-3xl tracking-[0.5em]"
            />
            {error ? <div className="text-xs text-rose-600">{error}</div> : null}
            <Button type="submit" disabled={busy || pin.length !== 6} className="w-full gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
