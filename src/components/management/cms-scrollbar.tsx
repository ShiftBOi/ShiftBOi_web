"use client";

import { OverlayScrollThumb } from "@/components/overlay-scroll-thumb";
import type { RefObject } from "react";

/**
 * Same mark as SiteScrollbar — short 2px thumb with difference blend —
 * wired to the CMS content card scroller instead of the document.
 */
export function CmsScrollbar({
  scrollRef,
}: {
  scrollRef: RefObject<HTMLElement | null> | { current: HTMLElement | null };
}) {
  return (
    <OverlayScrollThumb
      scrollRef={scrollRef}
      className="cms-shell__scrollbar right-[6px] z-20"
      pad={20}
      minSize={48}
    />
  );
}
