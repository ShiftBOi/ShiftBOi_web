"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCmsChat } from "@/components/cms/chat-context";

export function CmsChatAppShell({ children }: { children: ReactNode }) {
  const { open, width } = useCmsChat();
  return (
    <div
      className={`cms-app${open ? " has-chat" : ""}`}
      style={
        open
          ? ({ "--cms-chat-width": `${width}px` } as CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}
