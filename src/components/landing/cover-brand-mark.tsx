"use client";

import {
  buildCoverBrandSvg,
  ensureCoverSvgCrop,
  normalizeCoverBrand,
  type CoverBrandLayout,
} from "@/lib/cover-brand";
import { useMemo } from "react";

type Props = {
  layout?: CoverBrandLayout | null;
  text?: string | null;
  logoUrl?: string | null;
  fontId?: string | null;
  /** Prefers baked SVG when present */
  svgMarkup?: string | null;
  className?: string;
};

/** Full-bleed SVG brand overlay — same 16/10 frame as editor + `.hq-feat-media`. */
export function CoverBrandMark({
  layout: layoutRaw,
  text,
  logoUrl,
  fontId,
  svgMarkup,
  className,
}: Props) {
  const label = (text || "").trim();
  const layout = normalizeCoverBrand(layoutRaw, label);
  const logo = (logoUrl || "").trim();
  const baked = svgMarkup?.trim() || "";
  const hasText = layout.texts.some((t) => t.content.trim());
  const hasImages = layout.images.length > 0;

  const liveSvg = useMemo(() => {
    if (baked) return "";
    if (!hasText && !logo && !hasImages) return "";
    return buildCoverBrandSvg({
      layout,
      text: label,
      logoUrl: logo,
      fontId,
    });
  }, [baked, layout, label, logo, fontId, hasText, hasImages]);

  const markup = ensureCoverSvgCrop(baked || liveSvg);
  if (!markup) return null;

  return (
    <div
      className={className ?? "hq-cover-brand-svg"}
      aria-hidden
      dangerouslySetInnerHTML={{
        __html: markup.replace(/^<\?xml[^>]*>\s*/i, ""),
      }}
    />
  );
}
