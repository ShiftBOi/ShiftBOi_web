"use client";

import { cn } from "cn";

/** Full-width solid bar; amount + % sit as plain text above. */
export function CmsTickMeter({
  value,
  max,
  amountLabel,
  className,
  tone = "accent",
}: {
  value: number;
  max: number;
  /** e.g. "1.2 MB / 10 GB" */
  amountLabel: string;
  className?: string;
  tone?: "accent" | "warm";
}) {
  if (!(max > 0)) return null;

  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={cn("cms-tick-meter", `is-${tone}`, className)}>
      <div className="cms-tick-meter__row">
        <span className="cms-tick-meter__amount">{amountLabel}</span>
        <span className="cms-tick-meter__pct">{pct}%</span>
      </div>
      <div
        className="cms-tick-meter__track"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="cms-tick-meter__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
