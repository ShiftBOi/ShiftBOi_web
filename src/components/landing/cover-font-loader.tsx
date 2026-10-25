"use client";

import { coverFontsStylesheetUrl } from "@/lib/cover-fonts";
import { useEffect } from "react";

const LINK_ID = "hq-cover-fonts";

/** Injects Google Fonts for cover title presets used on the page. */
export function CoverFontLoader({ fontIds }: { fontIds: string[] }) {
  useEffect(() => {
    const href = coverFontsStylesheetUrl(fontIds);
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [fontIds.join("|")]);

  return null;
}
