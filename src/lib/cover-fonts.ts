/**
 * Google Font presets for project cover titles (English display).
 */

import type { CSSProperties } from "react";

export type CoverFontPreset = {
  id: string;
  label: string;
  family: string;
  google: string;
  weight: number;
  tracking?: string;
  transform?: "none" | "uppercase";
};

export const COVER_FONT_PRESETS: CoverFontPreset[] = [
  { id: "inter", label: "Inter", family: '"Inter", ui-sans-serif, system-ui, sans-serif', google: "Inter:wght@400;500;600;700;800", weight: 600, tracking: "-0.04em" },
  { id: "space-grotesk", label: "Space Grotesk", family: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif', google: "Space+Grotesk:wght@400;500;600;700", weight: 600, tracking: "-0.03em" },
  { id: "outfit", label: "Outfit", family: '"Outfit", ui-sans-serif, system-ui, sans-serif', google: "Outfit:wght@400;500;600;700;800", weight: 600, tracking: "-0.03em" },
  { id: "syne", label: "Syne", family: '"Syne", ui-sans-serif, system-ui, sans-serif', google: "Syne:wght@500;600;700;800", weight: 700, tracking: "-0.035em" },
  { id: "bebas-neue", label: "Bebas Neue", family: '"Bebas Neue", ui-sans-serif, system-ui, sans-serif', google: "Bebas+Neue", weight: 400, tracking: "0.04em", transform: "uppercase" },
  { id: "archivo", label: "Archivo", family: '"Archivo", ui-sans-serif, system-ui, sans-serif', google: "Archivo:wght@500;600;700;800", weight: 700, tracking: "-0.02em" },
  { id: "playfair", label: "Playfair", family: '"Playfair Display", ui-serif, Georgia, serif', google: "Playfair+Display:wght@500;600;700;800", weight: 700, tracking: "-0.02em" },
  { id: "instrument-serif", label: "Instrument", family: '"Instrument Serif", ui-serif, Georgia, serif', google: "Instrument+Serif:ital@0;1", weight: 400, tracking: "-0.02em" },
  { id: "rubik", label: "Rubik", family: '"Rubik", ui-sans-serif, system-ui, sans-serif', google: "Rubik:wght@400;500;600;700", weight: 600, tracking: "-0.02em" },
  { id: "dm-sans", label: "DM Sans", family: '"DM Sans", ui-sans-serif, system-ui, sans-serif', google: "DM+Sans:wght@400;500;600;700", weight: 600, tracking: "-0.03em" },
  { id: "poppins", label: "Poppins", family: '"Poppins", ui-sans-serif, system-ui, sans-serif', google: "Poppins:wght@400;500;600;700;800", weight: 600, tracking: "-0.02em" },
  { id: "montserrat", label: "Montserrat", family: '"Montserrat", ui-sans-serif, system-ui, sans-serif', google: "Montserrat:wght@500;600;700;800", weight: 700, tracking: "-0.03em" },
  { id: "raleway", label: "Raleway", family: '"Raleway", ui-sans-serif, system-ui, sans-serif', google: "Raleway:wght@500;600;700;800", weight: 600, tracking: "-0.02em" },
  { id: "manrope", label: "Manrope", family: '"Manrope", ui-sans-serif, system-ui, sans-serif', google: "Manrope:wght@500;600;700;800", weight: 600, tracking: "-0.03em" },
  { id: "sora", label: "Sora", family: '"Sora", ui-sans-serif, system-ui, sans-serif', google: "Sora:wght@500;600;700;800", weight: 600, tracking: "-0.03em" },
  { id: "cabinet", label: "Cabin", family: '"Cabin", ui-sans-serif, system-ui, sans-serif', google: "Cabin:wght@500;600;700", weight: 600, tracking: "-0.01em" },
  { id: "libre-baskerville", label: "Libre Baskerville", family: '"Libre Baskerville", ui-serif, Georgia, serif', google: "Libre+Baskerville:wght@400;700", weight: 700, tracking: "-0.01em" },
  { id: "lora", label: "Lora", family: '"Lora", ui-serif, Georgia, serif', google: "Lora:wght@500;600;700", weight: 600, tracking: "-0.01em" },
  { id: "cormorant", label: "Cormorant", family: '"Cormorant Garamond", ui-serif, Georgia, serif', google: "Cormorant+Garamond:wght@500;600;700", weight: 600, tracking: "-0.01em" },
  { id: "oswald", label: "Oswald", family: '"Oswald", ui-sans-serif, system-ui, sans-serif', google: "Oswald:wght@400;500;600;700", weight: 500, tracking: "0.02em", transform: "uppercase" },
  { id: "anton", label: "Anton", family: '"Anton", ui-sans-serif, system-ui, sans-serif', google: "Anton", weight: 400, tracking: "0.02em", transform: "uppercase" },
  { id: "pacifico", label: "Pacifico", family: '"Pacifico", cursive', google: "Pacifico", weight: 400, tracking: "0" },
  { id: "lobster", label: "Lobster", family: '"Lobster", cursive', google: "Lobster", weight: 400, tracking: "0" },
  { id: "jetbrains-mono", label: "JetBrains Mono", family: '"JetBrains Mono", ui-monospace, monospace', google: "JetBrains+Mono:wght@500;600;700", weight: 600, tracking: "-0.02em" },
];

export type CoverFontId = string;

export const DEFAULT_COVER_FONT: CoverFontId = "inter";

export function isCoverFontId(value: unknown): value is CoverFontId {
  return (
    typeof value === "string" &&
    COVER_FONT_PRESETS.some((p) => p.id === value)
  );
}

export function normalizeCoverFont(value: unknown): CoverFontId {
  return isCoverFontId(value) ? value : DEFAULT_COVER_FONT;
}

export function getCoverFontPreset(id: unknown): CoverFontPreset {
  const normalized = normalizeCoverFont(id);
  return (
    COVER_FONT_PRESETS.find((p) => p.id === normalized) ?? COVER_FONT_PRESETS[0]!
  );
}

/** Google Fonts CSS2 URL for one or many presets (or all when empty). */
export function coverFontsStylesheetUrl(ids?: Iterable<string>) {
  const wanted = new Set<string>();
  if (ids) {
    for (const id of ids) {
      if (isCoverFontId(id)) wanted.add(id);
    }
  }
  const list =
    wanted.size > 0
      ? COVER_FONT_PRESETS.filter((p) => wanted.has(p.id))
      : COVER_FONT_PRESETS;
  const families = list.map((p) => `family=${p.google}`);
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

export function coverFontStyle(id: unknown): CSSProperties {
  const preset = getCoverFontPreset(id);
  return {
    fontFamily: preset.family,
    fontWeight: preset.weight,
    letterSpacing: preset.tracking,
    textTransform: preset.transform ?? "none",
  };
}
