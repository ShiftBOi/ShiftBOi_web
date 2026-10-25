import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGroq } from "@ai-sdk/groq";
import { tool, type LanguageModel } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/project-draft";

export function usesGroq() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export function usesSiteGroq() {
  return Boolean(
    process.env.GROQ_SITE_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim(),
  );
}

/** CMS chat always has a provider path: Groq when keyed, else local Ollama. */
export function isCmsAiConfigured() {
  return true;
}

/** Kept for status UI — semantic Gemini search disabled (optional / unused on Vercel). */
export function isGeminiConfigured() {
  return false;
}

export function getCmsAiProviderInfo() {
  if (usesGroq()) {
    return {
      provider: "Groq" as const,
      model: process.env.GROQ_CMS_MODEL?.trim() || "openai/gpt-oss-120b",
      configured: true,
    };
  }
  return {
    provider: "Ollama" as const,
    model: process.env.OLLAMA_MODEL?.trim() || "llama3.2",
    configured: true,
  };
}

function getOllamaChatModel() {
  const baseURL = (
    process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1"
  ).replace(/\/$/, "");
  const ollama = createOpenAICompatible({
    name: "ollama",
    baseURL,
    apiKey: process.env.OLLAMA_API_KEY ?? "ollama",
  });
  return ollama.chatModel(process.env.OLLAMA_MODEL ?? "llama3.2");
}

/** Prefer Groq when keyed; fall back to local Ollama (CMS chat). */
export function getCmsChatModel(): LanguageModel {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (apiKey) {
    const groq = createGroq({ apiKey });
    return groq(process.env.GROQ_CMS_MODEL?.trim() || "openai/gpt-oss-120b") as LanguageModel;
  }
  return getOllamaChatModel() as LanguageModel;
}

/** Public site chat — separate Groq key/model when set, else CMS Groq, else Ollama. */
export function getSiteChatModel(): LanguageModel {
  const apiKey =
    process.env.GROQ_SITE_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim();
  if (apiKey) {
    const groq = createGroq({ apiKey });
    const model =
      process.env.GROQ_SITE_MODEL?.trim() ||
      process.env.GROQ_CMS_MODEL?.trim() ||
      "openai/gpt-oss-120b";
    return groq(model) as LanguageModel;
  }
  return getOllamaChatModel() as LanguageModel;
}

const highlightSchema = z.object({
  metric: z.string(),
  label: z.string(),
  title: z.string(),
  body: z.string(),
});

const sectionSchema = z.object({
  label: z.string(),
  title: z.string(),
  paragraphs: z.array(z.string()),
  bullets: z.array(z.string()).optional(),
});

const projectFieldsSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(120).optional(),
  summary: z.string().min(1).max(800).optional(),
  description: z.string().min(1).optional(),
  year: z.string().max(4).nullable().optional(),
  role: z.string().nullable().optional(),
  thesisLead: z.string().nullable().optional(),
  thesisHighlight: z.string().nullable().optional(),
  thesisRest: z.string().nullable().optional(),
  thesisBody: z.string().nullable().optional(),
  heroMetric: z.string().nullable().optional(),
  heroMetricLabel: z.string().nullable().optional(),
  heroTitle: z.string().nullable().optional(),
  heroBody: z.string().nullable().optional(),
  techStack: z.array(z.string()).optional(),
  visibility: z.enum(["PUBLIC", "CONFIDENTIAL"]).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  highlights: z.array(highlightSchema).optional(),
  sections: z.array(sectionSchema).optional(),
});

function projectSearchText(p: {
  title: string;
  slug: string;
  summary: string;
  description: string;
  year: string | null;
  role: string | null;
  techStack: string[];
}) {
  return [
    p.title,
    p.slug,
    p.summary,
    p.description,
    p.year ?? "",
    p.role ?? "",
    p.techStack.join(" "),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Keyword project search (Gemini embeddings removed — avoids AI SDK type conflicts on Vercel). */
export async function findProjectsByMeaning(query: string, limit = 5) {
  const projects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      description: true,
      year: true,
      role: true,
      techStack: true,
      published: true,
      featured: true,
      visibility: true,
    },
  });

  if (projects.length === 0) return [];

  const q = query.toLowerCase().trim();
  if (!q) return projects.slice(0, limit).map((p) => ({ ...p, score: 1 }));

  return projects
    .map((p) => {
      const hay = projectSearchText(p).toLowerCase();
      const score = hay.includes(q) ? 1 : q.split(/\s+/).filter((w) => w && hay.includes(w)).length;
      return { ...p, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export type WriteMode = "bypass" | "approval";

const confirmField = z
  .boolean()
  .optional()
  .describe(
    "Set true only after the operator Approves (approval mode) or clearly confirms a destructive action.",
  );

function needsWriteApproval(writeMode: WriteMode, confirm?: boolean) {
  return writeMode === "approval" && confirm !== true;
}

export function buildCmsProjectTools(opts?: { writeMode?: WriteMode }) {
  const writeMode: WriteMode =
    opts?.writeMode === "approval" ? "approval" : "bypass";

  return {
    ...buildCmsExtraTools(writeMode),
    list_projects: tool({
      description: "List all CMS projects with id, slug, title, publish flags.",
      inputSchema: z.object({}),
      execute: async () => {
        const projects = await prisma.project.findMany({
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          select: {
            id: true,
            slug: true,
            title: true,
            year: true,
            published: true,
            featured: true,
            visibility: true,
          },
        });
        return { count: projects.length, projects };
      },
    }),

    search_projects: tool({
      description:
        "Search projects by title/summary/stack keywords. Use before update/delete when the target is vague.",
      inputSchema: z.object({
        query: z.string().describe("Natural language or project name fragment"),
        limit: z.number().int().min(1).max(10).optional(),
      }),
      execute: async ({ query, limit }) => {
        const matches = await findProjectsByMeaning(query, limit ?? 5);
        return {
          matches: matches.map((m) => ({
            id: m.id,
            slug: m.slug,
            title: m.title,
            summary: m.summary,
            year: m.year,
            published: m.published,
            featured: m.featured,
            visibility: m.visibility,
            score: Number(m.score.toFixed(4)),
          })),
        };
      },
    }),

    create_project: tool({
      description:
        "Create a portfolio project. Map messy notes into title, slug, summary, year, role, thesis*, hero*, techStack, highlights, sections, published/featured/visibility. In approval mode call once without confirm — a Confirm card appears; after Approve call again with confirm:true.",
      inputSchema: projectFieldsSchema.extend({
        title: z.string().min(1).max(200),
        summary: z.string().min(1).max(800).optional(),
        description: z.string().min(1).optional(),
        confirm: confirmField,
      }),
      execute: async (input) => {
        const title = input.title;
        let slug = (input.slug || slugify(title)).slice(0, 120);
        if (!slug) slug = `project-${Date.now()}`;
        if (needsWriteApproval(writeMode, input.confirm)) {
          return {
            ok: false,
            needConfirm: true,
            action: "create",
            slug,
            published: input.published ?? false,
            preview: { title, summary: input.summary || title },
          };
        }

        const existing = await prisma.project.findUnique({ where: { slug } });
        if (existing) slug = `${slug}-${Date.now().toString(36)}`;

        const summary = input.summary || title;
        const description = input.description || summary;

        const project = await prisma.project.create({
          data: {
            slug,
            title,
            summary,
            description,
            year: input.year ?? null,
            role: input.role ?? null,
            thesisLead: input.thesisLead ?? null,
            thesisHighlight: input.thesisHighlight ?? null,
            thesisRest: input.thesisRest ?? null,
            thesisBody: input.thesisBody ?? description,
            heroMetric: input.heroMetric ?? null,
            heroMetricLabel: input.heroMetricLabel ?? null,
            heroTitle: input.heroTitle ?? title,
            heroBody: input.heroBody ?? summary,
            techStack: input.techStack ?? [],
            visibility: input.visibility ?? "PUBLIC",
            featured: input.featured ?? false,
            published: input.published ?? false,
            highlights: input.highlights ?? [],
            sections: input.sections ?? [],
            sortOrder: 0,
          },
        });

        return {
          ok: true,
          action: "created",
          project: {
            id: project.id,
            slug: project.slug,
            title: project.title,
            editUrl: `/cms/projects/${project.id}`,
          },
        };
      },
    }),

    update_project: tool({
      description:
        "Update an existing project by projectId or projectSlug. In approval mode call once without confirm; after Approve call again with confirm:true.",
      inputSchema: projectFieldsSchema.extend({
        projectId: z.string().optional(),
        projectSlug: z.string().optional(),
        confirm: confirmField,
      }),
      execute: async (input) => {
        const { projectId, projectSlug, confirm, ...rest } = input;
        if (!projectId && !projectSlug) {
          return { ok: false, error: "Provide projectId or projectSlug" };
        }

        const where = projectId
          ? { id: projectId }
          : { slug: projectSlug! };
        const current = await prisma.project.findUnique({ where });
        if (!current) return { ok: false, error: "Project not found" };

        const data: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(rest)) {
          if (value !== undefined) data[key] = value;
        }
        if (Object.keys(data).length === 0) {
          return { ok: false, error: "No fields to update" };
        }

        if (needsWriteApproval(writeMode, confirm)) {
          return {
            ok: false,
            needConfirm: true,
            action: "update",
            slug: current.slug,
            published: current.published,
            preview: { title: current.title, changed: Object.keys(data) },
          };
        }

        const project = await prisma.project.update({
          where: { id: current.id },
          data,
        });

        return {
          ok: true,
          action: "updated",
          project: {
            id: project.id,
            slug: project.slug,
            title: project.title,
            editUrl: `/cms/projects/${project.id}`,
            changed: Object.keys(data),
          },
        };
      },
    }),

    delete_project: tool({
      description:
        "Permanently delete a project. Always requires confirm:true (and Approve card in approval mode).",
      inputSchema: z.object({
        projectId: z.string().optional(),
        projectSlug: z.string().optional(),
        confirm: confirmField,
      }),
      execute: async ({ projectId, projectSlug, confirm }) => {
        if (!projectId && !projectSlug) {
          return { ok: false, error: "Provide projectId or projectSlug" };
        }

        const where = projectId
          ? { id: projectId }
          : { slug: projectSlug! };
        const current = await prisma.project.findUnique({ where });
        if (!current) return { ok: false, error: "Project not found" };

        if (needsWriteApproval(writeMode, confirm) || !confirm) {
          return {
            ok: false,
            needConfirm: true,
            action: "delete",
            slug: current.slug,
            published: current.published,
            preview: { title: current.title },
          };
        }

        await prisma.project.delete({ where: { id: current.id } });
        return {
          ok: true,
          action: "deleted",
          project: { id: current.id, slug: current.slug, title: current.title },
        };
      },
    }),
  };
}

function buildCmsExtraTools(writeMode: WriteMode = "bypass") {
  return {
    get_project: tool({
      description:
        "Get one project by id or slug with core copy fields. Use before update_project when you need current values.",
      inputSchema: z.object({
        projectId: z.string().optional(),
        projectSlug: z.string().optional(),
      }),
      execute: async ({ projectId, projectSlug }) => {
        if (!projectId && !projectSlug) {
          return { ok: false, error: "Provide projectId or projectSlug" };
        }
        const where = projectId ? { id: projectId } : { slug: projectSlug! };
        const project = await prisma.project.findUnique({ where });
        if (!project) return { ok: false, error: "Project not found" };
        return {
          ok: true,
          project: {
            id: project.id,
            slug: project.slug,
            title: project.title,
            summary: project.summary,
            description: project.description,
            year: project.year,
            role: project.role,
            techStack: project.techStack,
            visibility: project.visibility,
            featured: project.featured,
            published: project.published,
            thesisLead: project.thesisLead,
            thesisHighlight: project.thesisHighlight,
            thesisRest: project.thesisRest,
            thesisBody: project.thesisBody,
            heroMetric: project.heroMetric,
            heroMetricLabel: project.heroMetricLabel,
            heroTitle: project.heroTitle,
            heroBody: project.heroBody,
            highlights: project.highlights,
            sections: project.sections,
            editUrl: `/cms/projects/${project.id}`,
          },
        };
      },
    }),

    get_about: tool({
      description:
        "Read ShiftBOi about bundle: headline/bio/pitch, profile chrome, education, work, skills.",
      inputSchema: z.object({}),
      execute: async () => {
        const { getAboutBundle } = await import("@/lib/cms-about");
        const bundle = await getAboutBundle();
        return { ok: true, ...bundle, editUrl: "/cms" };
      },
    }),

    update_about_field: tool({
      description:
        "Update one about copy field: headline, bio, or pitch. Approval mode needs confirm:true after Approve.",
      inputSchema: z.object({
        field: z.enum(["headline", "bio", "pitch"]),
        value: z.string().max(8000),
        confirm: confirmField,
      }),
      execute: async ({ field, value, confirm }) => {
        if (needsWriteApproval(writeMode, confirm)) {
          return {
            ok: false,
            needConfirm: true,
            action: "update_about",
            slug: field,
            preview: { field, value: value.slice(0, 200) },
          };
        }
        const { getAboutBundle, saveAboutBundle } = await import("@/lib/cms-about");
        const bundle = await getAboutBundle();
        bundle.about = { ...bundle.about, [field]: value };
        await saveAboutBundle(bundle);
        return { ok: true, field, editUrl: "/cms" };
      },
    }),

    update_profile_field: tool({
      description:
        "Update profile chrome: name, title, wordmark, heroSubhead, heroHelper, or email. Approval mode needs confirm:true after Approve.",
      inputSchema: z.object({
        field: z.enum([
          "name",
          "title",
          "wordmark",
          "heroSubhead",
          "heroHelper",
          "email",
        ]),
        value: z.string().max(500),
        confirm: confirmField,
      }),
      execute: async ({ field, value, confirm }) => {
        if (needsWriteApproval(writeMode, confirm)) {
          return {
            ok: false,
            needConfirm: true,
            action: "update_profile",
            slug: field,
            preview: { field, value },
          };
        }
        const { getAboutBundle, saveAboutBundle } = await import("@/lib/cms-about");
        const bundle = await getAboutBundle();
        bundle.profile = { ...bundle.profile, [field]: value };
        await saveAboutBundle(bundle);
        return { ok: true, field, editUrl: "/cms" };
      },
    }),

    get_site_setting: tool({
      description: "Read a site setting JSON blob by key (hero, contact, services, brand, stats, focus, engagement).",
      inputSchema: z.object({
        key: z.enum([
          "hero",
          "contact",
          "services",
          "brand",
          "stats",
          "focus",
          "engagement",
        ]),
      }),
      execute: async ({ key }) => {
        const row = await prisma.siteSetting.findUnique({ where: { key } });
        return { key, value: row?.value ?? null };
      },
    }),

    update_site_setting: tool({
      description:
        "Upsert a site setting JSON value for the given key. Approval mode needs confirm:true after Approve.",
      inputSchema: z.object({
        key: z.enum([
          "hero",
          "contact",
          "services",
          "brand",
          "stats",
          "focus",
          "engagement",
        ]),
        value: z.unknown(),
        confirm: confirmField,
      }),
      execute: async ({ key, value, confirm }) => {
        if (needsWriteApproval(writeMode, confirm)) {
          return {
            ok: false,
            needConfirm: true,
            action: "update_site",
            slug: key,
            preview: { key },
          };
        }
        const row = await prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: value as object },
          update: { value: value as object },
        });
        return { ok: true, key: row.key, editUrl: "/cms/settings" };
      },
    }),

    list_inquiries: tool({
      description: "List recent contact inquiries.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).optional(),
        unreadOnly: z.boolean().optional(),
      }),
      execute: async ({ limit, unreadOnly }) => {
        const inquiries = await prisma.inquiry.findMany({
          where: unreadOnly ? { read: false } : undefined,
          orderBy: { createdAt: "desc" },
          take: limit ?? 20,
          select: {
            id: true,
            email: true,
            name: true,
            message: true,
            read: true,
            createdAt: true,
            source: true,
          },
        });
        return { count: inquiries.length, inquiries, editUrl: "/cms/inquiries" };
      },
    }),

    summarize_inquiries: tool({
      description: "Return unread/total inquiry counts and a short sample of latest messages.",
      inputSchema: z.object({}),
      execute: async () => {
        const [total, unread, latest] = await Promise.all([
          prisma.inquiry.count(),
          prisma.inquiry.count({ where: { read: false } }),
          prisma.inquiry.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, email: true, name: true, message: true, createdAt: true },
          }),
        ]);
        return { total, unread, latest, editUrl: "/cms/inquiries" };
      },
    }),

    mark_inquiry_read: tool({
      description:
        "Mark one inquiry as read or unread by id. Approval mode needs confirm:true after Approve.",
      inputSchema: z.object({
        inquiryId: z.string().min(1),
        read: z.boolean().default(true),
        confirm: confirmField,
      }),
      execute: async ({ inquiryId, read, confirm }) => {
        const row = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
        if (!row) return { ok: false, error: "Inquiry not found" };
        if (needsWriteApproval(writeMode, confirm)) {
          return {
            ok: false,
            needConfirm: true,
            action: "mark_inquiry",
            slug: inquiryId,
            preview: { email: row.email, read },
          };
        }
        await prisma.inquiry.update({
          where: { id: inquiryId },
          data: { read },
        });
        return { ok: true, id: inquiryId, read, editUrl: "/cms/inquiries" };
      },
    }),

    list_activities: tool({
      description: "List recent Activities & Updates posts.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(40).optional(),
        publishedOnly: z.boolean().optional(),
      }),
      execute: async ({ limit, publishedOnly }) => {
        const activities = await prisma.activity.findMany({
          where: publishedOnly ? { isPublished: true } : undefined,
          orderBy: { publishedAt: "desc" },
          take: limit ?? 20,
          select: {
            id: true,
            slug: true,
            title: true,
            detail: true,
            isPublished: true,
            publishedAt: true,
            activityTypeId: true,
          },
        });
        return { count: activities.length, activities, editUrl: "/cms" };
      },
    }),

    create_activity: tool({
      description:
        "Create an Activities & Updates post. Auto-slug from title if omitted. Defaults to unpublished draft. Approval mode needs confirm:true after Approve.",
      inputSchema: z.object({
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(120).optional(),
        detail: z.string().max(8000).optional(),
        coverImage: z.string().optional(),
        isPublished: z.boolean().optional(),
        activityTypeId: z.string().optional(),
        confirm: confirmField,
      }),
      execute: async (input) => {
        let slug = (input.slug || slugify(input.title)).slice(0, 120);
        if (!slug) slug = `activity-${Date.now()}`;
        if (needsWriteApproval(writeMode, input.confirm)) {
          return {
            ok: false,
            needConfirm: true,
            action: "create_activity",
            slug,
            preview: { title: input.title },
          };
        }
        const existing = await prisma.activity.findUnique({ where: { slug } });
        if (existing) slug = `${slug}-${Date.now().toString(36)}`;
        const activity = await prisma.activity.create({
          data: {
            title: input.title,
            slug,
            detail: input.detail ?? null,
            coverImage: input.coverImage ?? null,
            isPublished: input.isPublished ?? false,
            activityTypeId: input.activityTypeId ?? null,
            publishedAt: new Date(),
          },
        });
        return {
          ok: true,
          action: "created",
          activity: {
            id: activity.id,
            slug: activity.slug,
            title: activity.title,
            editUrl: "/cms",
          },
        };
      },
    }),

    search_cms: tool({
      description:
        "Keyword search across projects, about bundle, site settings, activities, and inquiries.",
      inputSchema: z.object({ query: z.string().min(1) }),
      execute: async ({ query }) => {
        const q = query.toLowerCase();
        const { getAboutBundle } = await import("@/lib/cms-about");
        const [projects, settings, inquiries, activities, about] = await Promise.all([
          findProjectsByMeaning(query, 5),
          prisma.siteSetting.findMany({ select: { key: true, value: true } }),
          prisma.inquiry.findMany({
            orderBy: { createdAt: "desc" },
            take: 40,
            select: { id: true, email: true, name: true, message: true },
          }),
          prisma.activity.findMany({
            orderBy: { publishedAt: "desc" },
            take: 40,
            select: { id: true, slug: true, title: true, detail: true },
          }),
          getAboutBundle(),
        ]);
        const matchedSettings = settings
          .filter((s) => JSON.stringify(s.value).toLowerCase().includes(q) || s.key.includes(q))
          .slice(0, 5);
        const matchedInquiries = inquiries
          .filter((i) =>
            [i.email, i.name || "", i.message || ""].join(" ").toLowerCase().includes(q),
          )
          .slice(0, 5);
        const matchedActivities = activities
          .filter((a) =>
            [a.title, a.slug, a.detail || ""].join(" ").toLowerCase().includes(q),
          )
          .slice(0, 5);
        const aboutHit = JSON.stringify(about).toLowerCase().includes(q);
        return {
          projects: projects.map((p) => ({ id: p.id, title: p.title, slug: p.slug })),
          about: aboutHit ? { headline: about.about.headline, editUrl: "/cms" } : null,
          settings: matchedSettings.map((s) => ({ key: s.key })),
          activities: matchedActivities,
          inquiries: matchedInquiries,
        };
      },
    }),

    remember: tool({
      description: "Save an operator memory fact for future CMS chat turns.",
      inputSchema: z.object({
        key: z.string().min(1).max(120),
        value: z.string().min(1).max(4000),
      }),
      execute: async ({ key, value }) => {
        const row = await prisma.cmsAiMemory.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
        return { ok: true, key: row.key };
      },
    }),

    forget_memory: tool({
      description: "Delete a saved operator memory by key.",
      inputSchema: z.object({ key: z.string().min(1) }),
      execute: async ({ key }) => {
        await prisma.cmsAiMemory.deleteMany({ where: { key } });
        return { ok: true, key };
      },
    }),

    list_memories: tool({
      description: "List saved operator memories.",
      inputSchema: z.object({}),
      execute: async () => {
        const memories = await prisma.cmsAiMemory.findMany({
          orderBy: { updatedAt: "desc" },
        });
        return { memories };
      },
    }),

    search_knowledge: tool({
      description: "Search indexed CMS knowledge snippets.",
      inputSchema: z.object({ query: z.string().min(1) }),
      execute: async ({ query }) => {
        const rows = await prisma.cmsAiKnowledge.findMany({
          orderBy: { updatedAt: "desc" },
          take: 40,
        });
        const q = query.toLowerCase();
        return {
          matches: rows
            .filter((r) =>
              `${r.title}\n${r.content}\n${r.source || ""}`.toLowerCase().includes(q),
            )
            .slice(0, 8),
        };
      },
    }),

    help_commands: tool({
      description: "List slash commands, @mentions, tools, and Bypass/Approve write modes.",
      inputSchema: z.object({}),
      execute: async () => ({
        writeModes: [
          "Bypass — writes run immediately (composer pill)",
          "Approve — Confirm card before create/update/delete; call again with confirm:true",
        ],
        mentions: [
          "@project:slug — focus a portfolio project",
          "@about — about + profile bundle",
          "@inquiries — contact inbox",
          "@activities — Activities & Updates",
        ],
        commands: [
          "/project list — list projects",
          "/project create — create from notes",
          "/project get — inspect one project",
          "/project polish — improve EN copy",
          "/project unpublish — keep as draft",
          "/project delete — permanent delete",
          "/about — show about + profile",
          "/about update — edit headline|bio|pitch",
          "/site — read a site setting key",
          "/site update — upsert hero|contact|services|brand|…",
          "/activity list — Activities & Updates",
          "/activity create — draft an update",
          "/inquiry list — recent inquiries",
          "/inquiry summary — triage inbox",
          "/search <query> — search CMS",
          "/remember — save a memory",
          "/help — this list",
        ],
      }),
    }),
  };
}

export async function loadAssistantContextPrompt() {
  const memories = prisma.cmsAiMemory
    ? await prisma.cmsAiMemory
        .findMany({ orderBy: { updatedAt: "desc" }, take: 20 })
        .catch(() => [])
    : [];
  const knowledge = prisma.cmsAiKnowledge
    ? await prisma.cmsAiKnowledge
        .findMany({ orderBy: { updatedAt: "desc" }, take: 12 })
        .catch(() => [])
    : [];
  const parts: string[] = [];
  if (memories.length) {
    parts.push(
      "Operator memories:\n" +
        memories.map((m) => `- ${m.key}: ${m.value}`).join("\n"),
    );
  }
  if (knowledge.length) {
    parts.push(
      "Knowledge snippets:\n" +
        knowledge
          .map((k) => `### ${k.title}\n${k.content.slice(0, 800)}`)
          .join("\n\n"),
    );
  }
  return parts.join("\n\n");
}

export const CMS_CHAT_SYSTEM = `You are Bloub, the ShiftBOi CMS operations assistant (Groq-backed) in the right sidebar.
Keep replies short and actionable. Use tools — never invent DB changes.

Capabilities:
- Projects: list_projects, search_projects, get_project, create_project, update_project, delete_project
- About: get_about, update_about_field (headline|bio|pitch), update_profile_field
- Activities: list_activities, create_activity
- Site settings: get_site_setting, update_site_setting (hero, contact, services, brand, stats, focus, engagement)
- Inquiries: list_inquiries, summarize_inquiries, mark_inquiry_read
- Memory/knowledge: remember, forget_memory, list_memories, search_knowledge, search_cms
- help_commands

Write modes (server-enforced):
- bypass — writes run immediately when you call the tool
- approval — call the write tool once WITHOUT confirm; a Confirm card appears. After Approve, call again with confirm:true. Do not only ask in chat text.

Rules:
1. Prefer search_projects / get_project before update/delete.
2. Auto kebab-case slug from title when creating.
3. Map timelines → sections[{label,title,paragraphs,bullets}]; metrics → highlights[{metric,label,title,body}].
4. thesisLead / thesisHighlight / thesisRest = hero sentence; thesisBody = paragraph.
5. visibility PUBLIC = Selected grid; CONFIDENTIAL = secret homepage row.
6. Never invent image URLs. After successful writes, summarize + editUrl.
7. Match the user's language (Thai or English).
8. Mentions @project:slug, @about, @inquiries, @activities focus that resource.
9. ShiftBOi about is a single EN bundle — no locale tables.
10. Slash commands (/project list, /about, /inquiry summary, /help, …) are operator shortcuts — follow them with tools.`;
