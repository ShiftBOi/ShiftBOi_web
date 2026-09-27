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

export function buildCmsProjectTools() {
  return {
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
        "Semantic search for projects using Gemini embeddings (title, summary, stack). Use before update/delete when the user names a project vaguely.",
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
        "Create a portfolio project. Map messy user notes into DB fields: title, slug, summary, year, role, thesis*, hero*, techStack, highlights, sections, published/featured/visibility. Auto-slug from title if omitted.",
      inputSchema: projectFieldsSchema.extend({
        title: z.string().min(1).max(200),
        summary: z.string().min(1).max(800).optional(),
        description: z.string().min(1).optional(),
      }),
      execute: async (input) => {
        const title = input.title;
        let slug = (input.slug || slugify(title)).slice(0, 120);
        if (!slug) slug = `project-${Date.now()}`;

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
        "Update an existing project. Identify with projectId (preferred) or projectSlug. Other fields are patches. Use search_projects first if unsure.",
      inputSchema: projectFieldsSchema.extend({
        projectId: z.string().optional(),
        projectSlug: z.string().optional(),
      }),
      execute: async (input) => {
        const { projectId, projectSlug, ...rest } = input;
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
        "Permanently delete a project by projectId or projectSlug. Confirm intent from the user before calling.",
      inputSchema: z.object({
        projectId: z.string().optional(),
        projectSlug: z.string().optional(),
        confirm: z
          .boolean()
          .describe("Must be true to delete. Set only when user clearly confirmed."),
      }),
      execute: async ({ projectId, projectSlug, confirm }) => {
        if (!confirm) {
          return {
            ok: false,
            error: "Deletion not confirmed. Ask the user to confirm.",
          };
        }
        if (!projectId && !projectSlug) {
          return { ok: false, error: "Provide projectId or projectSlug" };
        }

        const where = projectId
          ? { id: projectId }
          : { slug: projectSlug! };
        const current = await prisma.project.findUnique({ where });
        if (!current) return { ok: false, error: "Project not found" };

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

export const CMS_CHAT_SYSTEM = `You are the ShiftBOi CMS operations assistant.
You manage portfolio projects in Postgres via tools.

Capabilities:
- create_project, update_project, delete_project
- list_projects, search_projects (Gemini embeddings when available)

When the user pastes messy notes (timeline, name, stack, metrics, copy):
1. Infer structured fields matching the Project schema.
2. Prefer search_projects before update/delete if the target is vague.
3. For create: invent a kebab-case slug from the title if missing.
4. Map timelines / milestones into sections[{label,title,paragraphs,bullets}].
5. Map metrics / outcomes into highlights[{metric,label,title,body}].
6. thesisLead / thesisHighlight / thesisRest form the hero sentence; thesisBody is the paragraph.
7. visibility PUBLIC = Selected (detail page); CONFIDENTIAL = Limited teaser.
8. Do not invent image URLs.
9. After mutations, briefly summarize what changed and give the edit URL path.
10. Reply in the same language the user used (Thai or English).
11. Never claim you changed the DB without calling a tool.`;
