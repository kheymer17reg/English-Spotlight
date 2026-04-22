import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
        <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="font-display text-base font-semibold tracking-tight">
          Spotlight <span className="gradient-text">Learning</span>
        </span>
      )}
    </Link>
  );
}
