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

export type ProjectMedia = {
  type: "image" | "video";
  src: string;
  poster?: string;
  colorSrc?: string;
  bwSrc?: string;
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
  techStack: string[];
  visibility: "PUBLIC" | "CONFIDENTIAL";
  featured: boolean;
  published: boolean;
  highlights: HighlightItem[];
  sections: SectionItem[];
};

/** Scalar fields + dynamic highlight:/section: keys */
export type EditableField = string | null;

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

export function slugify(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
