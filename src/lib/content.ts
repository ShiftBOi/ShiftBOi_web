import type { Project, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  PortfolioProject,
  ProjectSection,
} from "@/lib/portfolio-projects";

export type HeroContent = {
  eyebrow: string;
  name: string;
  paragraphs: string[];
  ctaLabel: string;
};

export type StatItem = { value: string; label: string };

export type FocusItem = {
  id: string;
  label: string;
  teaser: string;
  title: string;
  points: string[];
};

export type EngagementTier = {
  name: string;
  price: string;
  detail: string;
  featured: boolean;
};

export type ContactContent = {
  title: string;
  body: string;
  ctaLabel: string;
  email: string;
};

export type BrandContent = {
  name: string;
  tagline: string;
  reference?: string;
};

export type SiteContent = {
  hero: HeroContent;
  stats: StatItem[];
  focus: FocusItem[];
  engagement: EngagementTier[];
  contact: ContactContent;
  brand: BrandContent;
};

const DEFAULT_SITE: SiteContent = {
  hero: {
    eyebrow: "Full-stack Web & Mobile Developer · ShiftBOi →",
    name: "Rapeepong Apichanakulchai",
    paragraphs: [
      "I design and ship production web & mobile products — from polished interfaces to APIs, data, and deploy.",
      "Building under ShiftBOi: fast iterations, clean systems, and AI-ready experiences.",
    ],
    ctaLabel: "Play with dino",
  },
  stats: [
    { value: "Web", label: "Next.js · React · TypeScript" },
    { value: "App", label: "Mobile · Cross-platform UI" },
    { value: "API", label: "Node · Postgres · Auth" },
    { value: "AI", label: "LLM features · Agents" },
  ],
  focus: [],
  engagement: [],
  contact: {
    title: "Get In Touch",
    body: "Have a product to ship — web, mobile, or AI-ready? Reach out and we'll scope it.",
    ctaLabel: "Open chat",
    email: "rapeepongapic@gmail.com",
  },
  brand: { name: "ShiftBOi", tagline: "Full-stack Web & Mobile" },
};

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: Prisma.JsonValue | null | undefined): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function mapProjectToPortfolio(row: Project): PortfolioProject {
  const media = asObject(row.media);
  const download = asObject(row.download);
  const highlights = asArray(row.highlights) as PortfolioProject["highlights"];
  const sections = asArray(row.sections) as ProjectSection[];

  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    thesisLead: row.thesisLead ?? "",
    thesisHighlight: row.thesisHighlight ?? "",
    thesisRest: row.thesisRest ?? "",
    thesisBody: row.thesisBody ?? row.description,
    year: row.year ?? "",
    role: row.role ?? "",
    heroMetric: row.heroMetric ?? "",
    heroMetricLabel: row.heroMetricLabel ?? "",
    heroTitle: row.heroTitle ?? row.title,
    heroBody: row.heroBody ?? row.summary,
    media: media
      ? {
          type: (media.type === "image" ? "image" : "video") as "video" | "image",
          src: String(media.src ?? ""),
          poster: media.poster ? String(media.poster) : undefined,
          colorSrc: media.colorSrc ? String(media.colorSrc) : undefined,
          bwSrc: media.bwSrc ? String(media.bwSrc) : undefined,
        }
      : undefined,
    introSrc: row.introSrc ?? row.coverImage ?? undefined,
    titleIcon: row.titleIcon ?? undefined,
    download: download
      ? {
          label: String(download.label ?? "Download"),
          href: String(download.href ?? "#"),
        }
      : undefined,
    highlights: Array.isArray(highlights) ? highlights : [],
    sections: Array.isArray(sections) ? sections : [],
    stack: row.techStack ?? [],
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  const rows = await prisma.siteSetting.findMany();
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const hero = asObject(byKey.hero);
  const brand = asObject(byKey.brand);
  const contact = asObject(byKey.contact);
  const stats = asArray(byKey.stats) as StatItem[];
  const focus = asArray(byKey.focus) as FocusItem[];
  const engagement = asArray(byKey.engagement) as EngagementTier[];

  return {
    hero: {
      eyebrow: String(hero?.eyebrow ?? DEFAULT_SITE.hero.eyebrow),
      name: String(hero?.name ?? DEFAULT_SITE.hero.name),
      paragraphs: Array.isArray(hero?.paragraphs)
        ? (hero.paragraphs as string[])
        : DEFAULT_SITE.hero.paragraphs,
      ctaLabel: String(hero?.ctaLabel ?? DEFAULT_SITE.hero.ctaLabel),
    },
    stats: stats.length ? stats : DEFAULT_SITE.stats,
    focus,
    engagement,
    contact: {
      title: String(contact?.title ?? DEFAULT_SITE.contact.title),
      body: String(contact?.body ?? DEFAULT_SITE.contact.body),
      ctaLabel: String(contact?.ctaLabel ?? DEFAULT_SITE.contact.ctaLabel),
      email: String(contact?.email ?? DEFAULT_SITE.contact.email),
    },
    brand: {
      name: String(brand?.name ?? DEFAULT_SITE.brand.name),
      tagline: String(brand?.tagline ?? DEFAULT_SITE.brand.tagline),
      reference: brand?.reference ? String(brand.reference) : undefined,
    },
  };
}

export async function getPublishedProjects(take = 12) {
  return prisma.project.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getFeaturedProjects(take = 4) {
  return prisma.project.findMany({
    where: { published: true, featured: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getPortfolioProjectBySlug(slug: string) {
  const row = await prisma.project.findUnique({ where: { slug } });
  if (!row || !row.published) return null;
  return mapProjectToPortfolio(row);
}

export async function getPortfolioSlugsFromDb() {
  const rows = await prisma.project.findMany({
    where: { published: true },
    select: { slug: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => r.slug);
}

export async function getOtherProjects(slug: string, take = 3) {
  const rows = await prisma.project.findMany({
    where: { published: true, NOT: { slug } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
  });
  return rows.map(mapProjectToPortfolio);
}

export async function getAllProjectsForCms() {
  return prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function getSiteSetting(key: string) {
  return prisma.siteSetting.findUnique({ where: { key } });
}
