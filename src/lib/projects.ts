import type { Project } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicAssetUrl } from "@/lib/public-asset";

export const LOCALES = ["en", "th", "ja", "fr", "zh"] as const;
export type ProjectLocale = (typeof LOCALES)[number];

/** ShiftBOi Project — no per-locale translation tables. */
export type ProjectFull = Project;

export const projectInclude = {} as const;

export function getTranslation(project: ProjectFull, _locale?: string) {
  return {
    title: project.title,
    tagline: project.summary ?? null,
    role: project.role ?? null,
    scope: project.scope ?? null,
    description: project.description,
    features: project.highlights ?? [],
    timeline: [],
  };
}

export function toLegacyProjectShape(project: ProjectFull) {
  return {
    id: project.id,
    slug: project.slug,
    year: project.year,
    isPublished: project.published,
    featured: project.featured,
    coverImage: project.coverImage,
    logo: null,
    coverText: null,
    coverFont: "inter",
    coverBrand: null,
    coverBrandSvg: null,
    galleryLayout: "bento",
    techStack: project.techStack,
    screenshots: project.media ?? [],
    links: project.links,
    isNda: project.visibility === "CONFIDENTIAL",
    projectTypeId: null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    projectType: null,
    translationEn: getTranslation(project, "en"),
    translationTh: null,
    translationJa: null,
    translationFr: null,
    translationZh: null,
    translations: { en: getTranslation(project, "en") },
  };
}

export async function hydrateCoverFields<T extends { coverImage?: string | null; slug: string }>(
  project: T,
): Promise<T & { coverUrl: string }> {
  return { ...project, coverUrl: resolveCoverUrl(project.coverImage, project.slug) };
}

export function toManagementListItem(project: ProjectFull) {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    year: project.year,
    isPublished: project.published,
    featured: project.featured,
    coverImage: project.coverImage,
    isNda: project.visibility === "CONFIDENTIAL",
  };
}

export async function findProjectByIdOrSlug(idOrSlug: string) {
  const byId = await prisma.project.findUnique({ where: { id: idOrSlug } });
  if (byId) return byId;
  return prisma.project.findUnique({ where: { slug: idOrSlug } });
}

function mapFeatureRows(
  features: unknown
): { title: string; description: string }[] {
  if (!Array.isArray(features)) return [];
  return features.map((item) => {
    if (typeof item === "string") return { title: item, description: "" };
    if (item && typeof item === "object") {
      const row = item as { title?: string; description?: string };
      return { title: row.title || "", description: row.description || "" };
    }
    return { title: "", description: "" };
  });
}

/** Public / API — drop blank feature rows. */
export function normalizeFeatures(features: unknown): {
  title: string;
  description: string;
}[] {
  return mapFeatureRows(features).filter((f) => f.title !== "");
}

/** CMS — keep empty drafts so Add feature can be filled in. */
export function normalizeFeaturesForEditor(features: unknown): {
  title: string;
  description: string;
}[] {
  return mapFeatureRows(features);
}

/** Full plain text from project description blocks (no ellipsis). */
export function plainFromDescription(
  description: string | null | undefined | unknown
): string {
  if (description == null || description === "") return "";

  let blocks: Array<{ type?: string; value?: string }> | null = null;
  if (Array.isArray(description)) {
    blocks = description as Array<{ type?: string; value?: string }>;
  } else if (typeof description === "string") {
    const trimmed = description.trim();
    if (trimmed.startsWith("[")) {
      try {
        const data = JSON.parse(trimmed) as unknown;
        if (Array.isArray(data)) {
          blocks = data as Array<{ type?: string; value?: string }>;
        }
      } catch {
        blocks = null;
      }
    }
  }

  if (blocks) {
    const text = blocks
      .filter((b) => b && b.type === "text" && typeof b.value === "string")
      .map((b) =>
        b
          .value!.replace(/<br\s*\/?>/gi, " ")
          .replace(/<\/p>/gi, " ")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean)
      .join(" ");
    if (text) return text;
  }

  const plain = String(description)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Avoid showing raw content-block JSON if parse somehow failed
  if (plain.startsWith("[{") && plain.includes('"type"')) return "";
  return plain;
}

/** Short blurb for cards / indexes — truncates long copy. */
export function summaryFromDescription(
  description: string | null | undefined | unknown
): string {
  const plain = plainFromDescription(description);
  return plain.length > 220 ? `${plain.slice(0, 220)}…` : plain;
}

export function resolveCoverUrl(cover: string | null | undefined, slug: string) {
  const FALLBACK: Record<string, string> = {
    "e-medical-learning-platform":
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    notelink:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  };

  if (!cover?.trim()) return FALLBACK[slug] ?? FALLBACK.notelink;

  const value = cover.trim();

  // Full URL (R2 public, CDN, etc.)
  if (/^https?:\/\//i.test(value)) return value;

  const r2Base = (
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    ""
  ).replace(/\/$/, "");

  // Migrated public/ paths → R2 public URL
  if (value.startsWith("/")) {
    return publicAssetUrl(value) || value;
  }

  // Bare R2 object key from CMS upload (coverimage/, gallery/, cms/, …)
  if (r2Base) {
    return `${r2Base}/${value.replace(/^\//, "")}`;
  }

  return FALLBACK[slug] ?? FALLBACK.notelink;
}

export type ContentBlock =
  | { id: string; type: "text"; value: string }
  | { id: string; type: "image"; src: string; alt?: string }
  | { id: string; type: "link"; url: string; label: string };

export const GALLERY_LAYOUTS = [
  "bento",
  "columns-2",
  "columns-3",
  "single",
  "mosaic",
  "fan",
] as const;
export type GalleryLayout = (typeof GALLERY_LAYOUTS)[number];

export type GalleryItem = {
  src: string;
  alt?: string;
  title?: string;
  text?: string;
};

/** One gallery “module” (bento / 2-col / single…) with placeholder slots. */
export type GalleryModule = {
  id: string;
  layout: GalleryLayout;
  items: GalleryItem[];
};

export const GALLERY_MODULE_SLOTS: Record<GalleryLayout, number> = {
  single: 1,
  "columns-2": 2,
  "columns-3": 3,
  bento: 4,
  mosaic: 6,
  fan: 5,
};

export function emptyGallerySlots(count: number): GalleryItem[] {
  return Array.from({ length: count }, () => ({
    src: "",
    alt: "",
    title: "",
    text: "",
  }));
}

export function createGalleryModule(layout: GalleryLayout): GalleryModule {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `gm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    layout,
    items: emptyGallerySlots(GALLERY_MODULE_SLOTS[layout]),
  };
}

export function parseContentBlocks(description: string | null | undefined): ContentBlock[] {
  if (!description) return [];
  try {
    const data = JSON.parse(description) as ContentBlock[];
    if (Array.isArray(data) && data[0] && "type" in data[0]) {
      return data.filter((b) => {
        if (b.type === "text") return Boolean(b.value?.replace(/<[^>]*>/g, "").trim());
        if (b.type === "image") return Boolean(b.src);
        if (b.type === "link") return Boolean(b.url);
        return false;
      });
    }
  } catch {
    // plain / HTML string
  }
  return [{ id: "legacy", type: "text", value: description }];
}

/** Like parseContentBlocks but keeps empty text/image/link blocks for CMS editing. */
export function parseContentBlocksForEditor(description: string | null | undefined): ContentBlock[] {
  if (!description) return [{ id: cryptoRandomId(), type: "text", value: "" }];
  try {
    const data = JSON.parse(description) as ContentBlock[];
    if (Array.isArray(data) && data[0] && "type" in data[0]) {
      return data.filter(
        (b) => b.type === "text" || b.type === "image" || b.type === "link"
      );
    }
  } catch {
    // plain
  }
  return [{ id: cryptoRandomId(), type: "text", value: description }];
}

function cryptoRandomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `b-${Date.now()}`;
}

function mapTimelineRows(
  timeline: unknown
): { date: string; info: string }[] {
  if (!Array.isArray(timeline)) return [];
  return timeline.map((item) => {
    if (!item || typeof item !== "object") return { date: "", info: "" };
    const row = item as { date?: string; info?: string };
    return { date: row.date || "", info: row.info || "" };
  });
}

/** Public / API — drop blank timeline steps. */
export function normalizeTimeline(timeline: unknown): {
  date: string;
  info: string;
}[] {
  return mapTimelineRows(timeline).filter((t) => t.date || t.info);
}

/** CMS — keep empty drafts so Add step can be filled in. */
export function normalizeTimelineForEditor(timeline: unknown): {
  date: string;
  info: string;
}[] {
  return mapTimelineRows(timeline);
}

export function normalizeTechStack(raw: unknown): { frontend: string[]; backend: string[] } {
  if (!raw || typeof raw !== "object") return { frontend: [], backend: [] };
  const row = raw as { frontend?: unknown; backend?: unknown };
  return {
    frontend: Array.isArray(row.frontend) ? row.frontend.map(String) : [],
    backend: Array.isArray(row.backend) ? row.backend.map(String) : [],
  };
}

export function normalizeLinks(raw: unknown): { label: string; url: string }[] {
  return normalizeLinksForEditor(raw).filter((l) => Boolean(l.url.trim()));
}

/** Keep empty rows so CMS can add/edit links before a URL is filled. */
export function normalizeLinksForEditor(
  raw: unknown
): { label: string; url: string }[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (!item || typeof item !== "object") return { label: "", url: "" };
      const row = item as { label?: string; name?: string; url?: string };
      return {
        label: row.label || row.name || "",
        url: row.url || "",
      };
    });
  }
  if (typeof raw === "object") {
    const legacy = raw as { demo?: string | null; github?: string | null };
    const out: { label: string; url: string }[] = [];
    if (legacy.demo) out.push({ label: "Demo", url: legacy.demo });
    if (legacy.github) out.push({ label: "GitHub", url: legacy.github });
    return out;
  }
  return [];
}

function isValidMediaUrl(url: string) {
  return /^https?:\/\//i.test(url) || url.startsWith("/");
}

function isGalleryModuleShape(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const row = item as { layout?: unknown; items?: unknown };
  return typeof row.layout === "string" && Array.isArray(row.items);
}

/** Keep empty placeholder slots for CMS gallery modules. */
export function normalizeGalleryItemsForEditor(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return [];
  // Module array → flatten for legacy callers
  if (raw.length > 0 && isGalleryModuleShape(raw[0])) {
    return raw.flatMap((mod) =>
      isGalleryModuleShape(mod)
        ? normalizeGalleryItemsForEditor(
            (mod as { items: unknown }).items
          )
        : []
    );
  }
  return raw
    .map((item) => {
      if (typeof item === "string") {
        return { src: item, alt: "", title: "", text: "" };
      }
      if (!item || typeof item !== "object") return null;
      if (isGalleryModuleShape(item)) return null;
      const row = item as {
        src?: string;
        url?: string;
        alt?: string;
        title?: string;
        text?: string;
        caption?: string;
      };
      return {
        src: row.src || row.url || "",
        alt: row.alt || "",
        title: row.title || "",
        text: row.text || row.caption || "",
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null) as GalleryItem[];
}

export function normalizeGalleryItems(raw: unknown): GalleryItem[] {
  return normalizeGalleryItemsForEditor(raw).filter((item) =>
    isValidMediaUrl(item.src)
  );
}

export function normalizeGalleryModules(
  raw: unknown,
  fallbackLayout?: unknown
): GalleryModule[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  if (isGalleryModuleShape(raw[0])) {
    return raw
      .filter(isGalleryModuleShape)
      .map((mod, i) => {
        const row = mod as {
          id?: string;
          layout?: string;
          items?: unknown;
        };
        const layout = normalizeGalleryLayout(row.layout);
        const items = normalizeGalleryItemsForEditor(row.items);
        const slots = GALLERY_MODULE_SLOTS[layout];
        const padded =
          items.length >= slots
            ? items.slice(0, Math.max(slots, items.length))
            : [...items, ...emptyGallerySlots(slots - items.length)];
        return {
          id: row.id || `gm-${i}`,
          layout,
          items: padded,
        };
      });
  }

  const items = normalizeGalleryItemsForEditor(raw);
  if (items.length === 0) return [];
  return [
    {
      id: "legacy",
      layout: normalizeGalleryLayout(fallbackLayout),
      items,
    },
  ];
}

/** Drop empty slots; keep module structure for persistence. */
export function serializeGalleryModules(modules: GalleryModule[]): GalleryModule[] {
  return modules
    .map((mod) => ({
      ...mod,
      layout: normalizeGalleryLayout(mod.layout),
      items: (mod.items || [])
        .map((item) => ({
          src: item.src || "",
          alt: item.alt || "",
          title: item.title || "",
          text: item.text || "",
        }))
        .filter((item) => isValidMediaUrl(item.src) || !item.src),
    }))
    .filter((mod) => mod.items.some((i) => isValidMediaUrl(i.src)) || mod.items.length > 0);
}

/** Legacy URL-only list — derived from gallery items. */
export function normalizeScreenshots(raw: unknown): string[] {
  return normalizeGalleryItems(raw).map((item) => item.src);
}

export function normalizeGalleryLayout(raw: unknown): GalleryLayout {
  const v = String(raw || "bento");
  return (GALLERY_LAYOUTS as readonly string[]).includes(v)
    ? (v as GalleryLayout)
    : "bento";
}

/** Live / CMS display — DD/MM/YY */
export function formatTimelineDate(date: string) {
  if (!date) return "";
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1].slice(2)}`;
  return date;
}

/**
 * Mask as-you-type into DD/MM/YY (e.g. 111222 → 11/12/22).
 * Digits only; max 6 → day(2)/month(2)/year(2).
 */
export function maskTimelineDateInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Parse typed timeline dates (DD/MM/YY or DD/MM/YYYY) → YYYY-MM-DD.
 * Returns "" for empty, null when incomplete/invalid.
 */
export function parseTimelineDate(input: string): string | null {
  const raw = maskTimelineDateInput(input).trim();
  if (!raw) return "";
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (m[3]!.length === 2) year += year >= 70 ? 1900 : 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const dt = new Date(`${iso}T00:00:00`);
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getFullYear() !== year ||
    dt.getMonth() + 1 !== month ||
    dt.getDate() !== day
  ) {
    return null;
  }
  return iso;
}


export type ProjectDetail = {
  id: string;
  slug: string;
  year: string;
  isNda: boolean;
  coverUrl: string;
  logo: string | null;
  coverText: string | null;
  coverFont: string;
  coverBrand: unknown;
  coverBrandSvg: string | null;
  galleryLayout: GalleryLayout;
  category: string;
  categoryColor: string | null;
  title: string;
  taglineHtml: string;
  role: string | null;
  scope: string | null;
  blocks: ContentBlock[];
  plainDescription: string;
  features: { title: string; description: string }[];
  timeline: { date: string; info: string }[];
  techStack: { frontend: string[]; backend: string[] };
  gallery: GalleryItem[];
  galleryModules: GalleryModule[];
  screenshots: string[];
  links: { label: string; url: string }[];
};

export function toProjectDetail(project: ProjectFull, locale: string): ProjectDetail {
  const t = getTranslation(project, locale);
  const blocks = parseContentBlocks(t.description);
  const galleryModules = normalizeGalleryModules(project.media, "bento")
    .map((mod) => ({
      ...mod,
      items: mod.items.filter((item) => isValidMediaUrl(item.src)),
    }))
    .filter((mod) => mod.items.length > 0);
  const gallery = galleryModules.flatMap((m) => m.items);
  return {
    id: project.id,
    slug: project.slug,
    year: project.year || "",
    isNda: project.visibility === "CONFIDENTIAL",
    coverUrl: resolveCoverUrl(project.coverImage, project.slug),
    logo: null,
    coverText: null,
    coverFont: "inter",
    coverBrand: null,
    coverBrandSvg: null,
    galleryLayout: normalizeGalleryLayout(galleryModules[0]?.layout ?? "bento"),
    category: "Project",
    categoryColor: null,
    title: t.title || project.slug,
    taglineHtml: t.tagline || "",
    role: t.role,
    scope: t.scope,
    blocks,
    plainDescription: plainFromDescription(t.description),
    features: normalizeFeatures(t.features),
    timeline: [],
    techStack: { frontend: project.techStack || [], backend: [] },
    gallery,
    galleryModules,
    screenshots: gallery.map((g) => g.src),
    links: normalizeLinks(project.links),
  };
}

export async function getPublishedProjectBySlug(slug: string, locale: string) {
  const project = await prisma.project.findFirst({
    where: { slug, published: true },
  });
  if (!project) return null;
  return toProjectDetail(project, locale);
}

export async function getAdjacentPublishedProject(slug: string, _locale: string) {
  const rows = await prisma.project.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { slug: true, title: true },
  });
  const i = rows.findIndex((r) => r.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? rows[i - 1] : null,
    next: i < rows.length - 1 ? rows[i + 1] : null,
  };
}

export function translationUpsertArgs(
  _locale: ProjectLocale,
  data: Record<string, unknown>,
) {
  return { create: data, update: data };
}
