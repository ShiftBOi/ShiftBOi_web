import { cache } from "react";
import type { Project, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  PortfolioProject,
  ProjectSection,
} from "@/lib/portfolio-projects";
import {
  asCollage,
  asLinks,
  asMedia,
  resolveBands,
  resolveDetails,
} from "@/lib/project-draft";

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
  /** Section eyebrow, e.g. // Get in touch // */
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  email: string;
  /** Hint under the form */
  helper: string;
  successMessage: string;
  github?: string;
  githubUrl?: string;
  linkedin?: string;
  linkedinUrl?: string;
  place?: string;
};

export type ServiceItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  /** Folder accent, e.g. #7c3aed */
  color?: string;
  /** Isometric SVG under /brand/services/ */
  figure?: string;
};

export type ServicesContent = {
  eyebrow: string;
  title: string;
  lead: string;
  items: ServiceItem[];
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
  services: ServicesContent;
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
    eyebrow: "// Get in touch //",
    title: "Get in touch",
    body: "I'm currently available for freelance work, partnering with founders and teams on product design and the engineering that ships it.",
    ctaLabel: "Send",
    email: "rapeepongapic@gmail.com",
    helper: "I read every note.",
    successMessage: "Sent — I’ll reply by email.",
    github: "@ShiftBOi",
    githubUrl: "https://github.com/ShiftBOi",
    linkedin: "ShiftBOi",
    linkedinUrl: "https://x.com/ShiftBOi_dev",
    place: "Thailand · remote",
  },
  services: {
    eyebrow: "ShiftBOi.web®",
    title: "Services",
    lead: "Design, build, ship, and keep it healthy — from brand to launch and beyond.",
    items: [
      {
        id: "brand",
        title: "Brand & Interface",
        summary:
          "Product UI systems and brand surfaces that stay coherent from marketing to the app shell.",
        tags: ["UI", "Design system", "Web"],
        figure: "/brand/services/01-brand.svg",
      },
      {
        id: "develop",
        title: "Develop",
        summary:
          "Full-stack product builds — public pages, CMS, and the APIs that keep them honest.",
        tags: ["Full-stack", "CMS", "Admin"],
        figure: "/brand/services/02-web.svg",
      },
      {
        id: "performance",
        title: "Performance",
        summary:
          "Core Web Vitals, bundle discipline, and shipping fast without throwing away craft.",
        tags: ["Perf", "CWV", "Bundle"],
        figure: "/brand/services/03-opt.svg",
      },
      {
        id: "seo",
        title: "SEO",
        summary:
          "Structure, meta, and sitemap work so the product can actually be found.",
        tags: ["Meta", "Schema", "Sitemap"],
        figure: "/brand/services/04-seo.svg",
      },
      {
        id: "ship",
        title: "Ship Product",
        summary:
          "CI/CD, hosting, and preview pipelines so demos survive the jump to production.",
        tags: ["CI/CD", "Hosting", "Preview"],
        figure: "/brand/services/05-devops.svg",
      },
      {
        id: "maint",
        title: "Maintenance",
        summary:
          "Support, updates, and monitoring so the thing you shipped stays healthy.",
        tags: ["Support", "Updates", "Monitor"],
        figure: "/brand/services/06-maint.svg",
      },
    ],
  },
  brand: { name: "ShiftBOi", tagline: "Full-stack Web & Mobile" },
};

function asServiceItems(value: unknown): ServiceItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw, index) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const row = raw as Record<string, unknown>;
      const title = String(row.title ?? "").trim();
      if (!title) return null;
      const tags = Array.isArray(row.tags)
        ? row.tags.map((t) => String(t)).filter(Boolean)
        : [];
      return {
        id: String(row.id ?? `service-${index}`),
        title,
        summary: String(row.summary ?? ""),
        tags,
        color: row.color ? String(row.color) : undefined,
        figure: row.figure ? String(row.figure) : undefined,
      } satisfies ServiceItem;
    })
    .filter((item): item is ServiceItem => Boolean(item));
}

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: Prisma.JsonValue | null | undefined): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function mapProjectToPortfolio(row: Project): PortfolioProject {
  const media = asMedia(row.media);
  const download = asObject(row.download);
  const highlights = asArray(row.highlights) as PortfolioProject["highlights"];
  const sections = asArray(row.sections) as ProjectSection[];
  const bands = resolveBands({
    bands: row.bands,
    media,
    heroTitle: row.heroTitle,
    heroBody: row.heroBody,
  });
  const details = resolveDetails({
    details: row.details,
    highlights: row.highlights,
    sections: row.sections,
  });
  const links = asLinks(row.links);

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
    scope: row.scope ?? undefined,
    links: links.length ? links : undefined,
    heroMetric: row.heroMetric ?? "",
    heroMetricLabel: row.heroMetricLabel ?? "",
    // Keep empty when unset — case study must not invent an Overview section.
    heroTitle: row.heroTitle ?? "",
    heroBody: row.heroBody ?? "",
    media: media
      ? {
          type: media.type,
          src: media.src,
          poster: media.poster,
          colorSrc: media.colorSrc,
          bwSrc: media.bwSrc,
          objectPosition: media.objectPosition,
        }
      : undefined,
    bands,
    collage: asCollage(row.collage),
    details,
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
  const services = asObject(byKey.services);
  const stats = asArray(byKey.stats) as StatItem[];
  const focus = asArray(byKey.focus) as FocusItem[];
  const engagement = asArray(byKey.engagement) as EngagementTier[];
  const serviceItems = asServiceItems(services?.items);

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
      eyebrow: String(contact?.eyebrow ?? DEFAULT_SITE.contact.eyebrow),
      title: String(contact?.title ?? DEFAULT_SITE.contact.title),
      body: String(contact?.body ?? DEFAULT_SITE.contact.body),
      ctaLabel: String(contact?.ctaLabel ?? DEFAULT_SITE.contact.ctaLabel),
      email: String(contact?.email ?? DEFAULT_SITE.contact.email),
      helper: String(contact?.helper ?? DEFAULT_SITE.contact.helper),
      successMessage: String(
        contact?.successMessage ?? DEFAULT_SITE.contact.successMessage,
      ),
      github: String(contact?.github ?? DEFAULT_SITE.contact.github ?? ""),
      githubUrl: String(
        contact?.githubUrl ?? DEFAULT_SITE.contact.githubUrl ?? "",
      ),
      linkedin: String(
        contact?.linkedin ?? DEFAULT_SITE.contact.linkedin ?? "",
      ),
      linkedinUrl: String(
        contact?.linkedinUrl ?? DEFAULT_SITE.contact.linkedinUrl ?? "",
      ),
      place: String(contact?.place ?? DEFAULT_SITE.contact.place ?? ""),
    },
    services: {
      eyebrow: String(services?.eyebrow ?? DEFAULT_SITE.services.eyebrow),
      title: String(services?.title ?? DEFAULT_SITE.services.title),
      lead: String(services?.lead ?? DEFAULT_SITE.services.lead),
      items: serviceItems.length ? serviceItems : DEFAULT_SITE.services.items,
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

/** Homepage Selected Projects grid (featured + public detail pages), rows of 2. */
export async function getFeaturedProjects(take = 24) {
  return prisma.project.findMany({
    where: { published: true, featured: true, visibility: "PUBLIC" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
    // Grid only needs card fields — skip heavy details/bands/collage JSON.
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      year: true,
      coverImage: true,
      introSrc: true,
      media: true,
    },
  });
}

/** Homepage Secret rows — one full-width teaser each (no Selected grid). */
export async function getSecretProjects(take = 12) {
  return prisma.project.findMany({
    where: { published: true, visibility: "CONFIDENTIAL" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
    select: {
      slug: true,
      title: true,
      summary: true,
      techStack: true,
      heroBody: true,
    },
  });
}

export async function getPublishedProjectBySlug(slug: string) {
  return prisma.project.findFirst({
    where: { slug, published: true },
    select: {
      slug: true,
      title: true,
      summary: true,
    },
  });
}

/** Dedupes metadata + page fetch in the same request. */
export const getPortfolioProjectBySlug = cache(async (slug: string) => {
  const row = await prisma.project.findUnique({ where: { slug } });
  if (!row || !row.published || row.visibility !== "PUBLIC") return null;
  return mapProjectToPortfolio(row);
});

export async function getPortfolioSlugsFromDb() {
  const rows = await prisma.project.findMany({
    where: { published: true, visibility: "PUBLIC" },
    select: { slug: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => r.slug);
}

export async function getOtherProjects(slug: string, take = 3) {
  const rows = await prisma.project.findMany({
    where: { published: true, visibility: "PUBLIC", NOT: { slug } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
    select: {
      slug: true,
      title: true,
      summary: true,
      year: true,
      introSrc: true,
      coverImage: true,
    },
  });
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    year: row.year ?? "",
    introSrc: row.introSrc ?? row.coverImage ?? undefined,
  }));
}

/** Previous / next published public projects in sort order. */
export async function getAdjacentProjects(slug: string) {
  const rows = await prisma.project.findMany({
    where: { published: true, visibility: "PUBLIC" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { slug: true, title: true },
  });
  const index = rows.findIndex((r) => r.slug === slug);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? rows[index - 1]! : null,
    next: index < rows.length - 1 ? rows[index + 1]! : null,
  };
}

export async function getAllProjectsForCms() {
  return prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function getSiteSetting(key: string) {
  return prisma.siteSetting.findUnique({ where: { key } });
}
