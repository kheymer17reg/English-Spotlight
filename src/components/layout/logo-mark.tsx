import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Spotlight Learning mark.
 *
 * Composition:
 *  - a small lamp head at the upper-right,
 *  - a tapered light beam descending to the lower-left,
 *  - an open book at the base that receives the beam,
 *  - a highlight mark on the illuminated page to evoke "learning picked out of the dark".
 *
 * Uses a linear gradient from the theme primary to accent tokens so it works on any background.
 */
export function LogoMark({
  className,
  size = 28,
  title = "Spotlight Learning",
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  const gid = React.useId();
  const beamId = `${gid}-beam`;
  const fillId = `${gid}-fill`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
        <linearGradient id={beamId} x1="30" y1="6" x2="10" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Light beam — tapered quadrilateral from lamp down to book spread */}
      <path
        d="M28 7.5 L33 9.2 L22.5 32 L7 27.5 Z"
        fill={`url(#${beamId})`}
      />

      {/* Lamp / spotlight head */}
      <circle cx="30.5" cy="8" r="3.4" fill={`url(#${fillId})`} />
      <circle cx="30.5" cy="8" r="1.4" fill="white" opacity="0.85" />

      {/* Open book — two pages forming a shallow V (spine slightly lowered) */}
      <path
        d="M6 26.5 C 11 24.5, 15.5 24.5, 19.5 27 L 19.5 33.2 C 15.5 30.7, 11 30.7, 6 32.7 Z"
        fill={`url(#${fillId})`}
        opacity="0.92"
      />
      <path
        d="M34 26.5 C 29 24.5, 24.5 24.5, 20.5 27 L 20.5 33.2 C 24.5 30.7, 29 30.7, 34 32.7 Z"
        fill={`url(#${fillId})`}
      />

      {/* Highlighted line on the illuminated (right) page */}
      <path
        d="M23.5 28.7 L 30.5 28.7"
        stroke="white"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M23.5 30.8 L 28.5 30.8"
        stroke="white"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Small spark dot just under the lamp — reads as a "spotlight" accent */}
      <circle cx="28.2" cy="11.8" r="0.7" fill="hsl(var(--primary))" opacity="0.9" />
    </svg>
  );
}
