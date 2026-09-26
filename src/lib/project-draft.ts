export type HighlightItem = {
  metric: string;
  label: string;
  title: string;
  body: string;
};

export type SectionItem = {
  label: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
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
  bullets?: string[];
};

/** Unified Details list — drag order is preserved site-wide */
export type DetailBlock = DetailHighlight | DetailSection;

export type ProjectMedia = {
  type: "image" | "video";
  src: string;
  poster?: string;
  colorSrc?: string;
  bwSrc?: string;
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

export type ProjectDraft = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  year: string | null;
  role: string | null;
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
  };
}

export function usesRevealHero(media: ProjectMedia | null | undefined) {
  const revealColor =
    media?.colorSrc ||
    media?.poster ||
    (media?.type === "image" ? media.src : undefined);
  return Boolean(revealColor && media?.bwSrc);
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
      bullets: Array.isArray(row.bullets)
        ? row.bullets.map((b) => String(b))
        : undefined,
    };
  });
}

export function asDetails(value: unknown): DetailBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const row = item as Record<string, unknown>;
      const kind = row.kind === "highlight" ? "highlight" : "section";
      const id = String(row.id ?? `${kind}-${index}`);
      if (kind === "highlight") {
        return {
          id,
          kind: "highlight" as const,
          metric: String(row.metric ?? ""),
          label: String(row.label ?? ""),
          title: String(row.title ?? ""),
          body: String(row.body ?? ""),
        } satisfies DetailHighlight;
      }
      return {
        id,
        kind: "section" as const,
        label: String(row.label ?? "Section"),
        title: String(row.title ?? ""),
        paragraphs: Array.isArray(row.paragraphs)
          ? row.paragraphs.map((p) => String(p))
          : row.body
            ? [String(row.body)]
            : [],
        bullets: Array.isArray(row.bullets)
          ? row.bullets.map((b) => String(b))
          : undefined,
      } satisfies DetailSection;
    })
    .filter((b): b is DetailBlock => Boolean(b));
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
      .map(({ label, title, paragraphs, bullets }) => ({
        label,
        title,
        paragraphs,
        bullets,
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
    bullets: block.bullets ?? [],
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
