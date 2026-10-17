export type HighlightItem = {
  metric: string;
  label: string;
  title: string;
  body: string;
};

/** Sentinel src — section media intentionally removed (skip auto-fill). */
export const SECTION_MEDIA_CLEARED = "__none__";

export type SectionMedia = {
  type: "image" | "video";
  src: string;
  poster?: string;
};

export function isSectionMediaCleared(
  media: SectionMedia | null | undefined,
): boolean {
  return media?.src === SECTION_MEDIA_CLEARED;
}

export function clearedSectionMedia(): SectionMedia {
  return { type: "image", src: SECTION_MEDIA_CLEARED };
}

export type PointCard = {
  text: string;
  /** Tech badge id from TECH_STACK_CATALOG */
  icon?: string | null;
};

export type SectionItem = {
  label: string;
  title: string;
  paragraphs: string[];
  bullets?: PointCard[];
  media?: SectionMedia | null;
};

export type DetailHighlight = {
  id: string;
  kind: "highlight";
  metric: string;
  label: string;
  title: string;
  body: string;
};

export type DetailSection = {
  id: string;
  kind: "section";
  label: string;
  title: string;
  paragraphs: string[];
  bullets?: PointCard[];
  media?: SectionMedia | null;
};

/** Unified Details list — drag order is preserved site-wide */
export type DetailBlock = DetailHighlight | DetailSection;

export type ProjectMedia = {
  type: "image" | "video";
  src: string;
  poster?: string;
  colorSrc?: string;
  bwSrc?: string;
  /** CSS object-position / background-position, e.g. "35% 50%" */
  objectPosition?: string;
};

/** Shared split media+copy box — identical pattern site-wide */
export type ProjectBand = {
  id: string;
  title: string;
  body: string;
  media: {
    type: "image" | "video";
    src: string;
    poster?: string;
  } | null;
};

export type ProjectLink = {
  label: string;
  href: string;
};

export type CollageItem = {
  id: string;
  type: "image" | "video";
  src: string;
  poster?: string;
};

export type ProjectDraft = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  year: string | null;
  role: string | null;
  scope: string | null;
  coverImage: string | null;
  introSrc: string | null;
  titleIcon: string | null;
  thesisLead: string | null;
  thesisHighlight: string | null;
  thesisRest: string | null;
  thesisBody: string | null;
  heroMetric: string | null;
  heroMetricLabel: string | null;
  heroTitle: string | null;
  heroBody: string | null;
  media: ProjectMedia | null;
  bands: ProjectBand[];
  /** End snap collage. null = auto from assets, [] = hidden section */
  collage: CollageItem[] | null;
  links: ProjectLink[];
  techStack: string[];
  visibility: "PUBLIC" | "CONFIDENTIAL";
  featured: boolean;
  published: boolean;
  /** @deprecated prefer details — kept for save sync */
  highlights: HighlightItem[];
  /** @deprecated prefer details — kept for save sync */
  sections: SectionItem[];
  details: DetailBlock[];
};

export function asLinks(value: unknown): ProjectLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      const href = String(row.href ?? "").trim();
      if (!label || !href) return null;
      return { label, href };
    })
    .filter((x): x is ProjectLink => Boolean(x));
}

/** Scalar fields + dynamic highlight:/section:/band:/detail: keys */
export type EditableField = string | null;

export function newBlockId(prefix = "block") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newBandId() {
  return newBlockId("band");
}

export function asMedia(value: unknown): ProjectMedia | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const src = String(row.src ?? "").trim();
  if (!src) return null;
  return {
    type: row.type === "image" ? "image" : "video",
    src,
    poster: row.poster ? String(row.poster) : undefined,
    colorSrc: row.colorSrc ? String(row.colorSrc) : undefined,
    bwSrc: row.bwSrc ? String(row.bwSrc) : undefined,
    objectPosition: row.objectPosition ? String(row.objectPosition) : undefined,
  };
}

export function usesRevealHero(media: ProjectMedia | null | undefined) {
  if (!media) return false;
  // Opt-in via colorSrc/bwSrc (CMS hero upload always sets both → auto reveal)
  if (media.colorSrc || media.bwSrc) {
    const color =
      media.colorSrc ||
      media.src ||
      media.poster ||
      (media.type === "image" ? media.src : undefined);
    return Boolean(color);
  }
  return false;
}

/** Resolve color + B&W sources for the scroll reveal (same file + CSS grayscale is fine). */
export function resolveRevealSources(media: ProjectMedia | null | undefined) {
  if (!usesRevealHero(media) || !media) return null;
  const colorSrc =
    media.colorSrc ||
    media.src ||
    media.poster ||
    (media.type === "image" ? media.src : "") ||
    "";
  if (!colorSrc) return null;
  return {
    colorSrc,
    bwSrc: media.bwSrc || colorSrc,
    objectPosition: media.objectPosition || "50% 50%",
    poster: media.poster,
  };
}

export function asBands(value: unknown): ProjectBand[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const row = item as Record<string, unknown>;
      const mediaRaw = row.media;
      let media: ProjectBand["media"] = null;
      if (mediaRaw && typeof mediaRaw === "object" && !Array.isArray(mediaRaw)) {
        const m = mediaRaw as Record<string, unknown>;
        const src = String(m.src ?? "").trim();
        if (src) {
          media = {
            type: m.type === "image" ? "image" : "video",
            src,
            poster: m.poster ? String(m.poster) : undefined,
          };
        }
      }
      return {
        id: String(row.id ?? `band-${index}`),
        title: String(row.title ?? ""),
        body: String(row.body ?? ""),
        media,
      } satisfies ProjectBand;
    })
    .filter((b): b is ProjectBand => Boolean(b));
}

/**
 * Prefer stored bands when the column is an array (including empty = intentionally none).
 * If bands is null/undefined, synthesize one from legacy heroTitle/heroBody/media.src
 * for non-reveal projects like SKNAT.
 */
export function resolveBands(input: {
  bands?: unknown;
  media?: ProjectMedia | null;
  heroTitle?: string | null;
  heroBody?: string | null;
}): ProjectBand[] {
  if (Array.isArray(input.bands)) {
    return asBands(input.bands);
  }

  const media = input.media ?? null;
  if (usesRevealHero(media)) return [];

  const hasCopy = Boolean(input.heroTitle?.trim() || input.heroBody?.trim());
  const boxSrc = media?.src?.trim();
  if (!hasCopy && !boxSrc) return [];

  return [
    {
      id: "legacy-hero",
      title: input.heroTitle ?? "",
      body: input.heroBody ?? "",
      media: boxSrc
        ? {
            type: media!.type,
            src: boxSrc,
            poster: media?.poster,
          }
        : null,
    },
  ];
}

export function emptyBand(): ProjectBand {
  return {
    id: newBandId(),
    title: "New media box",
    body: "Describe this block — same layout on every project page.",
    media: null,
  };
}

export function asHighlights(value: unknown): HighlightItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      metric: String(row.metric ?? ""),
      label: String(row.label ?? ""),
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
    };
  });
}

export function asPointCards(value: unknown): PointCard[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cards = value
    .map((item) => {
      if (typeof item === "string") {
        const text = item.trim();
        return text ? { text } : null;
      }
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const row = item as Record<string, unknown>;
      const text = String(row.text ?? row.body ?? "").trim();
      if (!text) return null;
      const iconRaw = row.icon;
      const icon =
        typeof iconRaw === "string" && iconRaw.trim() ? iconRaw.trim() : null;
      return { text, icon };
    })
    .filter((x): x is PointCard => Boolean(x));
  return cards.length ? cards : undefined;
}

function asSectionMedia(value: unknown): SectionMedia | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const src = String(row.src ?? "").trim();
  if (!src) return null;
  if (src === SECTION_MEDIA_CLEARED) {
    return clearedSectionMedia();
  }
  const type =
    row.type === "video" || /\.(mov|mp4|webm|m4v)(\?|#|$)/i.test(src)
      ? "video"
      : "image";
  const poster = String(row.poster ?? "").trim();
  return {
    type,
    src,
    ...(poster ? { poster } : {}),
  };
}

export function asCollage(value: unknown): CollageItem[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return null;
  if (value.length === 0) return [];
  const items: CollageItem[] = [];
  value.slice(0, 3).forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    const row = item as Record<string, unknown>;
    const src = String(row.src ?? "").trim();
    const type =
      row.type === "video" || (src && /\.(mov|mp4|webm|m4v)(\?|#|$)/i.test(src))
        ? ("video" as const)
        : ("image" as const);
    const poster = String(row.poster ?? "").trim();
    items.push({
      id: String(row.id ?? `collage-${index}`),
      type,
      src,
      ...(poster ? { poster } : {}),
    });
  });
  return items;
}

export function emptyCollageSlot(index = 0): CollageItem {
  return {
    id: `collage-${Date.now().toString(36)}-${index}`,
    type: "image",
    src: "",
  };
}

export function asSections(value: unknown): SectionItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      label: String(row.label ?? ""),
      title: String(row.title ?? ""),
      paragraphs: Array.isArray(row.paragraphs)
        ? row.paragraphs.map((p) => String(p))
        : [],
      bullets: asPointCards(row.bullets),
      media: asSectionMedia(row.media),
    };
  });
}

export function asDetails(value: unknown): DetailBlock[] {
  if (!Array.isArray(value)) return [];
  const blocks: DetailBlock[] = [];
  value.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    const row = item as Record<string, unknown>;
    const kind = row.kind === "highlight" ? "highlight" : "section";
    const id = String(row.id ?? `${kind}-${index}`);
    if (kind === "highlight") {
      blocks.push({
        id,
        kind: "highlight",
        metric: String(row.metric ?? ""),
        label: String(row.label ?? ""),
        title: String(row.title ?? ""),
        body: String(row.body ?? ""),
      });
      return;
    }
    blocks.push({
      id,
      kind: "section",
      label: String(row.label ?? "Section"),
      title: String(row.title ?? ""),
      paragraphs: Array.isArray(row.paragraphs)
        ? row.paragraphs.map((p) => String(p))
        : row.body
          ? [String(row.body)]
          : [],
      bullets: asPointCards(row.bullets),
      media: asSectionMedia(row.media),
    });
  });
  return blocks;
}

/** Prefer stored details; else build from legacy highlights + sections. */
export function resolveDetails(input: {
  details?: unknown;
  highlights?: unknown;
  sections?: unknown;
}): DetailBlock[] {
  if (Array.isArray(input.details)) {
    return asDetails(input.details);
  }

  const highlights = asHighlights(input.highlights);
  const sections = asSections(input.sections);
  return [
    ...highlights.map(
      (h, i): DetailHighlight => ({
        id: `legacy-highlight-${i}`,
        kind: "highlight",
        ...h,
      }),
    ),
    ...sections.map(
      (s, i): DetailSection => ({
        id: `legacy-section-${i}`,
        kind: "section",
        ...s,
      }),
    ),
  ];
}

export function splitDetails(details: DetailBlock[]): {
  highlights: HighlightItem[];
  sections: SectionItem[];
} {
  return {
    highlights: details
      .filter((d): d is DetailHighlight => d.kind === "highlight")
      .map(({ metric, label, title, body }) => ({ metric, label, title, body })),
    sections: details
      .filter((d): d is DetailSection => d.kind === "section")
      .map(({ label, title, paragraphs, bullets, media }) => ({
        label,
        title,
        paragraphs,
        bullets,
        media: media ?? null,
      })),
  };
}

export function emptyDetailSection(): DetailSection {
  return {
    id: newBlockId("section"),
    kind: "section",
    label: "Section",
    title: "New text section",
    paragraphs: ["Write the story here."],
    bullets: [],
    media: null,
  };
}

export function emptyDetailHighlight(): DetailHighlight {
  return {
    id: newBlockId("highlight"),
    kind: "highlight",
    metric: "01",
    label: "NEW",
    title: "New highlight",
    body: "Describe the outcome.",
  };
}

export function detailToServiceItem(block: DetailBlock) {
  if (block.kind === "highlight") {
    return {
      title: block.title,
      paragraphs: [block.body],
      bullets: [`${block.metric} · ${block.label}`],
    };
  }
  return {
    title: block.title,
    paragraphs: block.paragraphs.length ? block.paragraphs : [""],
    bullets: (block.bullets ?? []).map((b) => b.text),
  };
}

export function slugify(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
