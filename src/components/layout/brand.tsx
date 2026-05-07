import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/layout/logo-mark";

export function Brand({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-accent/10 shadow-glow">
        <LogoMark size={26} />
      </span>
      {!compact && (
        <span className="font-display text-base font-semibold tracking-tight">
          Spotlight <span className="gradient-text">Learning</span>
        </span>
      )}
    </Link>
  );
}
