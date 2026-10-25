"use client";

import { getSkillBadgeMeta, skillIconUrl } from "@/lib/skill-badges";
import { cn } from "cn";
import { useState } from "react";

export function SkillBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const meta = getSkillBadgeMeta(name);
  const iconSrc = skillIconUrl(meta);
  const [iconFailed, setIconFailed] = useState(false);
  const showIcon = Boolean(iconSrc) && !iconFailed;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-none px-2.5 py-1.5",
        "text-[11px] font-bold tracking-wide uppercase sm:text-xs",
        className
      )}
      style={{ backgroundColor: meta.bg, color: meta.fg }}
    >
      {showIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSrc!}
          alt=""
          width={14}
          height={14}
          className="size-3.5 shrink-0"
          loading="lazy"
          decoding="async"
          onError={() => setIconFailed(true)}
        />
      ) : (
        <span
          aria-hidden
          className="flex size-3.5 shrink-0 items-center justify-center text-[9px] font-black leading-none"
          style={{ backgroundColor: meta.fg, color: meta.bg }}
        >
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span>{name}</span>
    </span>
  );
}
