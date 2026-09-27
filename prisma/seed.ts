import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import { PORTFOLIO_PROJECTS } from "../src/lib/portfolio-projects";

const prisma = new PrismaClient();
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.toLowerCase().trim() || "rapeepongapic@gmail.com";

const FEATURED_SLUGS = new Set(["vibesaur", "sknat", "tastesiam", "worldgate"]);

const SITE_SETTINGS: Record<string, Prisma.InputJsonValue> = {
  brand: {
    name: "ShiftBOi",
    tagline: "Full-stack Web & Mobile",
    reference: "https://localhost:3001",
  },
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
  focus: [
    {
      id: "01",
      label: "WEB APPS",
      teaser: "Production web products with clean UX and solid foundations.",
      title: "Ship modern web apps — fast UI, reliable APIs, deploy-ready.",
      points: [
        "Next.js / React interfaces with intentional motion and accessibility.",
        "Auth, data models, and admin flows that hold up in production.",
        "Performance-minded frontends that stay maintainable as features grow.",
      ],
    },
    {
      id: "02",
      label: "MOBILE",
      teaser: "Mobile experiences that feel native and ship with the web stack.",
      title: "Build mobile surfaces that share logic without fighting the platform.",
      points: [
        "Cross-platform UI patterns tuned for touch, offline, and speed.",
        "Shared API contracts between web and mobile clients.",
        "Release-ready builds with clear handoff for store or internal distro.",
      ],
    },
    {
      id: "03",
      label: "FULL-STACK",
      teaser: "One builder across UI, API, data, and deploy.",
      title: "End-to-end ownership — fewer handoffs, tighter product loops.",
      points: [
        "Schema, auth, and business logic designed with the UI in mind.",
        "CMS and owner tools when you need content control without visitor login.",
        "From prototype to production without rewriting the stack mid-flight.",
      ],
    },
    {
      id: "04",
      label: "AI FEATURES",
      teaser: "Practical AI inside real products — not demos that die.",
      title: "Add LLM and agent features that fit the product, not the hype.",
      points: [
        "Chat, assistive flows, and retrieval wired into your existing app.",
        "Clear UX for loading, failure, and human handoff.",
        "Prompt and tool boundaries that stay inspectable and safe.",
      ],
    },
    {
      id: "05",
      label: "PRODUCT UI",
      teaser: "Interfaces with presence — brand-first, not template-default.",
      title: "Design systems and screens that make the product feel finished.",
      points: [
        "Typography, motion, and layout that reinforce the brand.",
        "Component structure teams can extend without visual drift.",
        "Detail work on empty states, forms, and edge cases that users actually hit.",
      ],
    },
  ],
  engagement: [
    {
      name: "Sprint",
      price: "Project",
      detail: "Scoped builds — landing, MVP, feature slice, or rebuild.",
      featured: false,
    },
    {
      name: "Retainer",
      price: "Ongoing",
      detail: "Continuous product work with a dedicated full-stack partner.",
      featured: true,
    },
    {
      name: "Collab",
      price: "Partner",
      detail: "Join your team for a phase — architecture, UI, or AI features.",
      featured: false,
    },
  ],
  contact: {
    title: "Get In Touch",
    body: "Have a product to ship — web, mobile, or AI-ready? Reach out and we'll scope it.",
    ctaLabel: "Open chat",
    email: "rapeepongapic@gmail.com",
  },
};

async function main() {
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: "Admin", emailVerified: true },
    create: {
      email: ADMIN_EMAIL,
      name: "Admin",
      emailVerified: true,
    },
  });

  for (const [index, p] of PORTFOLIO_PROJECTS.entries()) {
    const data = {
      title: p.title,
      summary: p.summary,
      description: p.thesisBody || p.summary,
      coverImage: p.introSrc ?? p.media?.poster ?? null,
      introSrc: p.introSrc ?? null,
      titleIcon: p.titleIcon ?? null,
      techStack: p.stack,
      year: p.year,
      role: p.role,
      thesisLead: p.thesisLead,
      thesisHighlight: p.thesisHighlight,
      thesisRest: p.thesisRest,
      thesisBody: p.thesisBody,
      heroMetric: p.heroMetric,
      heroMetricLabel: p.heroMetricLabel,
      heroTitle: p.heroTitle,
      heroBody: p.heroBody,
      media: (p.media ?? null) as Prisma.InputJsonValue,
      highlights: p.highlights as Prisma.InputJsonValue,
      sections: p.sections as Prisma.InputJsonValue,
      download: (p.download ?? null) as Prisma.InputJsonValue,
      visibility: "PUBLIC" as const,
      featured: FEATURED_SLUGS.has(p.slug),
      published: true,
      sortOrder: index,
    };

    await prisma.project.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });
  }

  // Remove legacy sample project if present
  await prisma.project.deleteMany({ where: { slug: "webport-v2" } });

  for (const [key, value] of Object.entries(SITE_SETTINGS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  console.log(`Seeded admin: ${user.email}`);
  console.log(`Seeded projects: ${PORTFOLIO_PROJECTS.length}`);
  console.log(`Seeded site settings: ${Object.keys(SITE_SETTINGS).length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
