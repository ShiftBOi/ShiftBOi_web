"use client";

import { SiteChatProvider } from "@/components/web/site-chat";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <SiteChatProvider>{children}</SiteChatProvider>;
}
