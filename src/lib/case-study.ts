import type { PortfolioProject } from "@/lib/portfolio-projects";
import {
  resolveDetails,
  SECTION_MEDIA_CLEARED,
  type DetailBlock,
  type DetailHighlight,
  type DetailSection,
  type PointCard,
} from "@/lib/project-draft";

export type CaseStudyLink = {
  label: string;
  href: string;
};

export type CaseStudyStat = {
  metric: string;
  label: string;
};

export type CaseStudyMedia = {
  type: "image" | "video";
  src: string;
  poster?: string;
  objectPosition?: string;
};

export type CaseStudySection = {
  id: string;
  label: string;
  title: string;
  paragraphs: string[];
  bullets: PointCard[];
  /** Optional product mock under the sticky body (Boros-style) */
  media?: CaseStudyMedia | null;
};

export type CaseStudyBand = {
  id: string;
  title: string;
  body: string;
  media: {
    type: "image" | "video";
    src: string;
    poster?: string;
  } | null;
};

export type CaseStudyView = {
  slug: string;
  title: string;
  tags: string[];
  /** Project tech stack labels for badge icons */
  stack: string[];
  hero: CaseStudyMedia | null;
  thesis: string;
  links: CaseStudyLink[];
  role: string;
  timeline: string;
  scope: string;
  stats: CaseStudyStat[];
  /** All narrative sections (sticky left title) */
  sections: CaseStudySection[];
  /** @deprecated use sections[0] */
  overview: CaseStudySection | null;
  /** @deprecated use sections[1] */
  problem: CaseStudySection | null;
  bands: CaseStudyBand[];
  collage: CaseStudyMedia[];
  download: CaseStudyLink | null;
};

function isVideoUrl(src: string) {
  return /\.(mov|mp4|webm|m4v)(\?|#|$)/i.test(src);
}

function splitTags(summary: string, stack: string[]): string[] {
  const fromSummary = summary
    .split(/[·•|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromSummary.length >= 2) return fromSummary.slice(0, 5);
  if (stack.length > 0) return stack.slice(0, 4);
  if (summary.trim()) return [summary.trim()];
  return [];
}

function composeThesis(project: PortfolioProject): string {
  // Prefer CMS thesis lead/highlight/rest when present (matches live preview).
  const parts = [project.thesisLead, project.thesisHighlight, project.thesisRest]
    .map((s) => s?.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts.join(" ").trim();
  const body = project.thesisBody?.trim();
  if (body) return body;
  return project.summary?.trim() || project.heroBody?.trim() || "";
}

function asMediaItem(
  src: string | undefined | null,
  poster?: string,
  objectPosition?: string,
): CaseStudyMedia | null {
  const clean = src?.trim();
  if (!clean || clean === SECTION_MEDIA_CLEARED) return null;
  return {
    type: isVideoUrl(clean) ? "video" : "image",
    src: clean,
    poster: poster || undefined,
    objectPosition,
  };
}

/** Prefer video hero; fall back to still / intro / cover. */
function heroMedia(project: PortfolioProject): CaseStudyMedia | null {
  const m = project.media;
  const poster = m?.poster || project.introSrc;
  const candidates = [
    m?.colorSrc,
    m?.type === "video" ? m.src : undefined,
    m?.src,
    m?.bwSrc,
    m?.poster,
    project.introSrc,
  ].filter((s): s is string => Boolean(s?.trim()));

  const videoSrc = candidates.find(isVideoUrl);
  if (videoSrc) {
    return {
      type: "video",
      src: videoSrc,
      poster: poster && !isVideoUrl(poster) ? poster : undefined,
      objectPosition: m?.objectPosition,
    };
  }

  const imageSrc = candidates.find((s) => !isVideoUrl(s));
  return asMediaItem(imageSrc, poster, m?.objectPosition);
}

function asLinks(raw: unknown): CaseStudyLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      const href = String(row.href ?? "").trim();
      if (!label || !href) return null;
      return { label, href };
    })
    .filter((x): x is CaseStudyLink => Boolean(x));
}

function sectionFromDetail(
  block: DetailSection,
  media?: CaseStudyMedia | null,
): CaseStudySection {
  return {
    id: block.id,
    label: block.label || "Section",
    title: block.title,
    paragraphs: block.paragraphs.filter(Boolean),
    bullets: (block.bullets ?? []).filter((b) => b.text?.trim()),
    media: media ?? null,
  };
}

function statsFrom(
  highlights: PortfolioProject["highlights"],
  details: DetailBlock[],
  project: PortfolioProject,
): CaseStudyStat[] {
  // CMS edits `details` highlight blocks — prefer those over legacy columns.
  const highlightBlocks = details.filter(
    (d): d is DetailHighlight => d.kind === "highlight",
  );
  const fromDetails = highlightBlocks
    .filter((h) => h.metric?.trim())
    .map((h) => ({
      metric: h.metric.trim(),
      label: h.label?.trim() || h.title || "",
    }));
  if (fromDetails.length > 0) return fromDetails.slice(0, 4);

  const fromHighlights = (highlights ?? [])
    .filter((h) => h.metric?.trim())
    .map((h) => ({
      metric: h.metric.trim(),
      label: h.label?.trim() || h.title || "",
    }));
  if (fromHighlights.length > 0) return fromHighlights.slice(0, 4);

  // Legacy single metric only when structured stats were never used.
  // CMS save clears heroMetric when highlights are empty.
  if (
    highlightBlocks.length === 0 &&
    (highlights?.length ?? 0) === 0 &&
    project.heroMetric?.trim()
  ) {
    return [
      {
        metric: project.heroMetric.trim(),
        label: project.heroMetricLabel?.trim() || "Highlight",
      },
    ];
  }
  return [];
}

/** Stills preferred for in-section mockups (videos stay in hero). */
function sectionGalleryPool(project: PortfolioProject): CaseStudyMedia[] {
  const out: CaseStudyMedia[] = [];
  const seen = new Set<string>();
  const push = (m: CaseStudyMedia | null | undefined) => {
    if (!m?.src || seen.has(m.src) || m.type === "video") return;
    seen.add(m.src);
    out.push(m);
  };

  push(asMediaItem(project.introSrc));
  push(asMediaItem(project.media?.poster));
  for (const band of project.bands ?? []) {
    push(asMediaItem(band.media?.src, band.media?.poster));
  }
  // Prefer color still if it's an image path
  push(asMediaItem(project.media?.colorSrc, project.media?.poster));
  push(asMediaItem(project.media?.src, project.media?.poster));
  return out;
}

function collageFrom(
  project: PortfolioProject,
  hero: CaseStudyMedia | null,
): CaseStudyMedia[] {
  // Explicit CMS collage: [] hides the section; non-empty uses those frames.
  if (Array.isArray(project.collage)) {
    return project.collage
      .map((item) => asMediaItem(item.src, item.poster))
      .filter((m): m is CaseStudyMedia => Boolean(m?.src))
      .slice(0, 3);
  }

  const out: CaseStudyMedia[] = [];
  const seen = new Set<string>();
  const push = (m: CaseStudyMedia | null | undefined) => {
    if (!m?.src || seen.has(m.src)) return;
    seen.add(m.src);
    out.push(m);
  };

  for (const band of project.bands ?? []) {
    if (!band.media?.src) continue;
    push(asMediaItem(band.media.src, band.media.poster));
  }
  push(hero);
  if (project.introSrc) {
    push(asMediaItem(project.introSrc));
  }
  for (const section of project.details ?? []) {
    if (section.kind !== "section" || !section.media?.src) continue;
    if (section.media.src === SECTION_MEDIA_CLEARED) continue;
    push(asMediaItem(section.media.src, section.media.poster));
  }
  // Match CMS snap collage: up to 3 frames
  return out.slice(0, 3);
}

/**
 * Attach gallery stills to some sections (Boros pattern):
 * prefer sections with bullets, then every other section after the first.
 * `clearedIds` are sections the author explicitly emptied — never auto-fill.
 */
function attachSectionMedia(
  sections: CaseStudySection[],
  pool: CaseStudyMedia[],
  clearedIds: Set<string>,
): CaseStudySection[] {
  if (pool.length === 0 || sections.length === 0) return sections;

  const targets = new Set<number>();
  sections.forEach((s, i) => {
    if (clearedIds.has(s.id)) return;
    if (s.bullets.length > 0) targets.add(i);
  });
  sections.forEach((s, i) => {
    if (clearedIds.has(s.id)) return;
    if (i > 0 && i % 2 === 1) targets.add(i);
  });
  // Ensure at least one mid-page visual if we have assets
  if (targets.size === 0 && sections.length > 1) {
    const idx = sections.findIndex((s, i) => i > 0 && !clearedIds.has(s.id));
    if (idx >= 0) targets.add(idx);
  }
  if (targets.size === 0) {
    const first = sections.findIndex((s) => !clearedIds.has(s.id));
    if (first >= 0) targets.add(first);
  }

  let cursor = 0;
  return sections.map((section, index) => {
    if (clearedIds.has(section.id)) {
      return { ...section, media: null };
    }
    if (section.media?.src) return section;
    if (!targets.has(index)) return section;
    const media = pool[cursor % pool.length] ?? null;
    cursor += 1;
    return { ...section, media };
  });
}

function buildSections(
  project: PortfolioProject,
  details: DetailBlock[],
): CaseStudySection[] {
  const detailSections = details.filter(
    (d): d is DetailSection => d.kind === "section",
  );
  const bands = project.bands ?? [];
  const bandMediaAt = (i: number): CaseStudyMedia | null => {
    const b = bands[i]?.media;
    if (!b?.src || b.src === SECTION_MEDIA_CLEARED) return null;
    return asMediaItem(b.src, b.poster);
  };

  const sections: CaseStudySection[] = [];
  const clearedIds = new Set<string>();
  let mediaIndex = 0;

  // Only when author set overview fields — never invent from title/summary.
  const hasHeroCopy = Boolean(
    project.heroTitle?.trim() || project.heroBody?.trim(),
  );
  if (hasHeroCopy) {
    sections.push({
      id: "overview-hero",
      label: "Overview",
      title: project.heroTitle?.trim() || project.title,
      paragraphs: project.heroBody?.trim() ? [project.heroBody.trim()] : [],
      bullets: [],
      media: bandMediaAt(mediaIndex++),
    });
  }

  for (const block of detailSections) {
    if (block.media?.src === SECTION_MEDIA_CLEARED) {
      clearedIds.add(block.id);
      sections.push(sectionFromDetail(block, null));
      continue;
    }
    const explicit = block.media?.src
      ? asMediaItem(block.media.src, block.media.poster)
      : null;
    sections.push(
      sectionFromDetail(
        block,
        explicit ?? bandMediaAt(mediaIndex++),
      ),
    );
  }

  return attachSectionMedia(
    sections,
    sectionGalleryPool(project),
    clearedIds,
  );
}

/** Map a portfolio project into the Boros-style case study view model. */
export function resolveCaseStudy(
  project: PortfolioProject & { scope?: string; links?: unknown },
): CaseStudyView {
  const details =
    project.details ??
    resolveDetails({
      highlights: project.highlights,
      sections: project.sections,
    });

  const sections = buildSections(project, details);
  const overview = sections[0] ?? null;
  const problem = sections[1] ?? null;

  const hero = heroMedia(project);
  const links = asLinks(project.links);
  if (links.length === 0 && project.download?.href) {
    links.push({
      label: project.download.label || "Download",
      href: project.download.href,
    });
  }

  const scope =
    project.scope?.trim() ||
    project.stack.slice(0, 3).join(", ") ||
    "";

  return {
    slug: project.slug,
    title: project.title,
    tags: splitTags(project.summary, project.stack),
    stack: project.stack ?? [],
    hero,
    thesis: composeThesis(project),
    links,
    role: project.role || "",
    timeline: project.year || "",
    scope,
    stats: statsFrom(project.highlights, details, project),
    sections,
    overview,
    problem,
    bands: (project.bands ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      body: b.body,
      media: b.media ?? null,
    })),
    collage: collageFrom(project, hero),
    download: project.download
      ? { label: project.download.label, href: project.download.href }
      : null,
  };
}
