"use client";

import type { BuiltinToolDef } from "@/lib/assistant/tool-catalog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "cn";
import { Wrench } from "lucide-react";

export function ToolChip({
  tool,
  className,
}: {
  tool: BuiltinToolDef;
  className?: string;
}) {
  const badge = `#${tool.id}`;

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={10}
        closeDelay={80}
        render={
          <span
            className={cn(
              "cms-ai-toolchip",
              `cms-ai-toolchip--${tool.access}`,
              className
            )}
          />
        }
      >
        <Wrench className="cms-ai-toolchip__icon" aria-hidden="true" />
        <span className="cms-ai-toolchip__label">{badge}</span>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        sideOffset={8}
        className="cms-ai-command-hovercard"
      >
        <strong className="cms-ai-command-hovercard__title">{tool.name}</strong>
        <p className="cms-ai-command-schema__empty">
          {tool.server} · {tool.access}
        </p>
        <p className="cms-ai-command-schema__empty">{tool.description}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
