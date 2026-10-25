"use client";

import {
  COVER_FONT_PRESETS,
  coverFontStyle,
  coverFontsStylesheetUrl,
  normalizeCoverFont,
  type CoverFontId,
} from "@/lib/cover-fonts";
import { cn } from "cn";
import { useEffect } from "react";

const LINK_ID = "hq-cover-fonts-cms";

export function CoverFontPicker({
  value,
  onChange,
  previewTitle,
  className,
}: {
  value: string | null | undefined;
  onChange: (id: CoverFontId) => void;
  previewTitle: string;
  className?: string;
}) {
  const active = normalizeCoverFont(value);
  const sample = previewTitle.trim() || "Project title";

  useEffect(() => {
    const href = coverFontsStylesheetUrl(COVER_FONT_PRESETS.map((p) => p.id));
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, []);

  return (
    <div className={cn("cms-cover-fonts", className)}>
      <div className="cms-cover-fonts__head">
        <p className="cms-cover-fonts__title">Cover text font</p>
        <p className="cms-cover-fonts__hint">
          Applies only to cover branding text on the image · not the project title
        </p>
      </div>

      <div className="cms-cover-fonts__grid" role="listbox" aria-label="Cover fonts">
        {COVER_FONT_PRESETS.map((preset) => {
          const selected = active === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={cn(
                "cms-cover-fonts__chip",
                selected && "is-active"
              )}
              onClick={() => onChange(preset.id)}
            >
              <span className="cms-cover-fonts__chip-label">{preset.label}</span>
              <span
                className="cms-cover-fonts__chip-sample"
                style={coverFontStyle(preset.id)}
              >
                {sample}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
