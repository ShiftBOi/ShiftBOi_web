"use client";

import { Reveal } from "@/components/landing/reveal";
import { cn } from "cn";

type SectionMarkProps = {
  label: string;
  delay?: number;
  size?: "md" | "lg";
  className?: string;
};

/**
 * Landing section label — Manrope title with a quiet chapter tick (no red bar).
 */
export function SectionMark({
  label,
  delay = 40,
  size = "lg",
  className,
}: SectionMarkProps) {
  return (
    <Reveal
      delay={delay}
      as="h2"
      className={cn("hq-section-mark group relative block", className)}
    >
      <span
        className={cn(
          "hq-section-mark__row inline-flex items-center",
          size === "lg" ? "gap-3.5" : "gap-2.5"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "hq-section-mark__tick shrink-0 rounded-full bg-[var(--hq-l1)]/25",
            size === "lg" ? "h-[0.55em] w-[3px]" : "h-[0.5em] w-[2.5px]"
          )}
        />
        <span
          className={cn(
            "hq-section-title block text-[var(--hq-l1)]",
            size === "lg"
              ? "text-[clamp(2rem,4.5vw,3.5rem)]"
              : "text-[clamp(1.5rem,3.2vw,2.25rem)]"
          )}
        >
          {label}
        </span>
      </span>
    </Reveal>
  );
}
