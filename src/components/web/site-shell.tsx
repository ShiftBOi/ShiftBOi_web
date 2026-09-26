"use client";

import { SiteBootSplash } from "@/components/web/site-boot-splash";
import { SiteChatProvider } from "@/components/web/site-chat";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <SiteChatProvider>
      <SiteBootSplash />
      {children}
    </SiteChatProvider>
  );
}
