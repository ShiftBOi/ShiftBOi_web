// @ts-nocheck
import type OpenAI from "openai";
import { getPrisma } from "@/lib/prisma";
import { projectInclude, LOCALES, type ProjectLocale } from "@/lib/projects";
import { setLocaleEnabled } from "@/lib/locale-access";
import { isLocale } from "@/i18n/settings";
import { SLASH_COMMANDS } from "@/lib/assistant/commands";
import { BUILTIN_TOOLS } from "@/lib/assistant/tool-catalog";
import { retrieveKnowledge } from "@/lib/assistant/knowledge";
import { languages } from "@/i18n/settings";
import { revalidatePath } from "next/cache";

export type ToolExecContext = {
  actor: { id: string; username?: string | null; email: string };
  enabledToolIds: Set<string>;
};

export type ToolExecResult = {
  ok: boolean;
  summary: string;
  data?: unknown;
};

function localeKey(locale: string): string {
  const map: Record<string, string> = {
    en: "translationEn",
    th: "translationTh",
    ja: "translationJa",
    fr: "translationFr",
    zh: "translationZh",
  };
  return map[locale] || "translationEn";
}

function slugFromName(name: string) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "project";
}

async function uniqueProjectSlug(base: string) {
  const root = base || "project";
  const existing = await getPrisma().project.findMany({
    where: { OR: [{ slug: root }, { slug: { startsWith: `${root}-` } }] },
    select: { slug: true },
  });
  const taken = new Set(existing.map((p) => p.slug));
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

async function audit(
  ctx: ToolExecContext,
  action: string,
  resource: string,
  details: unknown
) {
  try {
    await getPrisma().auditLog.create({
      data: {
        userId: ctx.actor.id,
        actor: ctx.actor.username || ctx.actor.email,
        action: action.toUpperCase(),
        resource,
        path: "/api/management/assistant",
        details: details as object,
      },
    });
  } catch {
    /* ignore */
  }
}

function revalidateProject(slug: string) {
  for (const locale of languages) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/project`);
    revalidatePath(`/${locale}/project/${slug}`);
  }
}

export function openaiToolsFor(enabled: Set<string>): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return BUILTIN_TOOLS.filter((t) => enabled.has(t.id)).map((t) => ({
    type: "function" as const,
    function: {
      name: t.id,
      description: t.description,
      parameters: toolParameters(t.id),
    },
  }));
}

/** Groq rejects `null` for `type: "string"` — optional fields must allow null. */
function optStr(extra?: Record<string, unknown>) {
  return { type: ["string", "null"], ...extra };
}

function toolParameters(id: string): Record<string, unknown> {
  const empty = {
    type: "object",
    properties: {},
    additionalProperties: false,
  };
  switch (id) {
    case "get_project":
      return {
        type: "object",
        properties: {
          slug: optStr(),
          id: optStr(),
          locale: optStr({ description: "en|th|ja|fr|zh" }),
        },
        additionalProperties: false,
      };
    case "create_project":
      return {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          description: optStr(),
          year: optStr(),
          isPublished: { type: ["boolean", "null"] },
        },
        additionalProperties: false,
      };
    case "update_project_copy":
      return {
        type: "object",
        required: ["slug", "locale"],
        properties: {
          slug: { type: "string" },
          locale: { type: "string", enum: [...LOCALES] },
          title: optStr(),
          tagline: optStr(),
          description: optStr(),
        },
        additionalProperties: false,
      };
    case "set_project_published":
      return {
        type: "object",
        required: ["slug", "published"],
        properties: {
          slug: { type: "string" },
          published: { type: "boolean" },
          confirm: {
            type: ["boolean", "null"],
            description:
              "Required true when unpublishing (published=false). Ask the user first.",
          },
        },
        additionalProperties: false,
      };
    case "delete_project":
      return {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
          confirm: {
            type: ["boolean", "null"],
            description:
              "Must be true after the user explicitly confirms deletion.",
          },
        },
        additionalProperties: false,
      };
    case "get_about":
      return {
        type: "object",
        properties: {
          locale: optStr({
            description: "en|th|ja|fr|zh — omit or null to default to en",
          }),
        },
        additionalProperties: false,
      };
    case "update_about_field":
      return {
        type: "object",
        required: ["locale", "field", "value"],
        properties: {
          locale: { type: "string", enum: [...LOCALES] },
          field: { type: "string", enum: ["headline", "bio", "pitch"] },
          value: { type: "string" },
        },
        additionalProperties: false,
      };
    case "list_inquiries":
      return {
        type: "object",
        properties: { limit: { type: ["number", "null"] } },
        additionalProperties: false,
      };
    case "search_cms":
    case "search_knowledge":
      return {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string" },
          topK: { type: ["number", "null"] },
        },
        additionalProperties: false,
      };
    case "set_locale_enabled":
      return {
        type: "object",
        required: ["locale", "enabled"],
        properties: {
          locale: { type: "string" },
          enabled: { type: "boolean" },
        },
        additionalProperties: false,
      };
    case "create_cms_user":
      return {
        type: "object",
        required: ["username", "email"],
        properties: {
          username: { type: "string" },
          email: { type: "string" },
        },
        additionalProperties: false,
      };
    case "remember":
      return {
        type: "object",
        required: ["text", "group"],
        properties: {
          text: { type: "string" },
          group: {
            type: "string",
            enum: ["about", "preferences", "projects", "people"],
          },
        },
        additionalProperties: false,
      };
    case "forget_memory":
      return {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } },
        additionalProperties: false,
      };
    default:
      return empty;
  }
}

export async function executeTool(
  name: string,
  argsJson: string,
  ctx: ToolExecContext
): Promise<ToolExecResult> {
  if (!ctx.enabledToolIds.has(name)) {
    return { ok: false, summary: `Tool ${name} is disabled` };
  }

  let args: Record<string, unknown> = {};
  try {
    args = argsJson ? (JSON.parse(argsJson) as Record<string, unknown>) : {};
  } catch {
    return { ok: false, summary: "Invalid tool arguments JSON" };
  }
  // Models often send explicit nulls for unused optional params.
  for (const key of Object.keys(args)) {
    if (args[key] === null || args[key] === undefined) delete args[key];
  }

  try {
    switch (name) {
      case "help_commands":
        return {
          ok: true,
          summary: `${SLASH_COMMANDS.length} commands`,
          data: {
            commands: SLASH_COMMANDS,
            tools: BUILTIN_TOOLS.filter((t) => ctx.enabledToolIds.has(t.id)).map(
              (t) => t.id
            ),
            mentions: ["@project:slug", "@about", "@inquiries"],
          },
        };

      case "list_projects": {
        const projects = await getPrisma().project.findMany({
          orderBy: { createdAt: "desc" },
          take: 40,
          include: { translationEn: true },
        });
        return {
          ok: true,
          summary: `${projects.length} projects`,
          data: projects.map((p) => ({
            id: p.id,
            slug: p.slug,
            year: p.year,
            title: p.translationEn?.title || p.slug,
            isPublished: p.isPublished,
          })),
        };
      }

      case "get_project": {
        const slug = String(args.slug || "");
        const id = String(args.id || "");
        const locale = (String(args.locale || "en") as ProjectLocale) || "en";
        const project = await getPrisma().project.findFirst({
          where: id ? { id } : { slug },
          include: projectInclude,
        });
        if (!project) return { ok: false, summary: "Project not found" };
        const key = localeKey(locale) as keyof typeof project;
        const row = (project as any)[key] || project.translationEn;
        return {
          ok: true,
          summary: `Loaded ${project.slug}`,
          data: {
            id: project.id,
            slug: project.slug,
            year: project.year,
            isPublished: project.isPublished,
            locale,
            title: row?.title,
            tagline: row?.tagline,
            description: row?.description,
          },
        };
      }

      case "create_project": {
        const name = String(args.name || "").trim();
        if (!name) return { ok: false, summary: "name is required" };
        const slug = await uniqueProjectSlug(slugFromName(name));
        const year = String(args.year || new Date().getFullYear());
        const description = String(args.description || "");
        const isPublished = args.isPublished === true;
        const project = await getPrisma().project.create({
          data: {
            slug,
            year,
            isPublished,
            featured: false,
            techStack: { frontend: [], backend: [] },
            links: [],
            translationEn: {
              create: { title: name, description, features: [] },
            },
          },
          include: { translationEn: true },
        });
        revalidateProject(project.slug);
        await audit(ctx, "CREATE", "projects", { slug: project.slug, name });
        return {
          ok: true,
          summary: `Created project “${name}” (${project.slug})`,
          data: {
            id: project.id,
            slug: project.slug,
            title: name,
            isPublished,
          },
        };
      }

      case "set_project_published": {
        const slug = String(args.slug || "").trim();
        if (!slug) return { ok: false, summary: "slug is required" };
        if (typeof args.published !== "boolean") {
          return { ok: false, summary: "published must be true or false" };
        }
        const project = await getPrisma().project.findUnique({ where: { slug } });
        if (!project) return { ok: false, summary: `Project not found: ${slug}` };
        if (args.published === false && args.confirm !== true) {
          return {
            ok: false,
            summary: `Confirm required to unpublish “${slug}”`,
            data: {
              needConfirm: true,
              action: "unpublish",
              slug,
              published: false,
            },
          };
        }
        await getPrisma().project.update({
          where: { id: project.id },
          data: { isPublished: args.published },
        });
        revalidateProject(slug);
        await audit(ctx, "UPDATE", "projects", {
          slug,
          isPublished: args.published,
        });
        return {
          ok: true,
          summary: args.published
            ? `Published “${slug}”`
            : `Unpublished “${slug}” (kept as draft)`,
          data: { slug, isPublished: args.published },
        };
      }

      case "delete_project": {
        const slug = String(args.slug || "").trim();
        if (!slug) return { ok: false, summary: "slug is required" };
        const project = await getPrisma().project.findUnique({ where: { slug } });
        if (!project) return { ok: false, summary: `Project not found: ${slug}` };
        if (args.confirm !== true) {
          return {
            ok: false,
            summary: `Confirm required to delete “${slug}”`,
            data: { needConfirm: true, action: "delete", slug },
          };
        }
        await getPrisma().project.delete({ where: { id: project.id } });
        revalidateProject(slug);
        await audit(ctx, "DELETE", "projects", { slug, id: project.id });
        return {
          ok: true,
          summary: `Deleted project “${slug}”`,
          data: { slug, id: project.id },
        };
      }

      case "update_project_copy": {
        const slug = String(args.slug || "");
        const locale = String(args.locale || "en");
        if (!LOCALES.includes(locale as ProjectLocale)) {
          return { ok: false, summary: "Invalid locale" };
        }
        const project = await getPrisma().project.findUnique({ where: { slug } });
        if (!project) return { ok: false, summary: "Project not found" };

        const data: Record<string, string> = {};
        if (typeof args.title === "string") data.title = args.title;
        if (typeof args.tagline === "string") data.tagline = args.tagline;
        if (typeof args.description === "string")
          data.description = args.description;
        if (Object.keys(data).length === 0) {
          return { ok: false, summary: "No fields to update" };
        }

        const rel = localeKey(locale);
        await (getPrisma() as any).project.update({
          where: { id: project.id },
          data: {
            [rel]: {
              upsert: {
                create: {
                  title: data.title || project.slug,
                  description: data.description || "",
                  tagline: data.tagline ?? null,
                  features: [],
                },
                update: data,
              },
            },
          },
        });
        revalidateProject(slug);
        await audit(ctx, "UPDATE", "projects", { slug, locale, fields: Object.keys(data) });
        return {
          ok: true,
          summary: `Updated ${slug} (${locale})`,
          data: { slug, locale, ...data },
        };
      }

      case "get_about": {
        const about = await getPrisma().about.findFirst({
          include: {
            translationEn: true,
            translationTh: true,
            translationJa: true,
            translationFr: true,
            translationZh: true,
          },
        });
        if (!about) return { ok: false, summary: "About not found" };

        const pick = (row: {
          headline?: string | null;
          bio?: string | null;
          pitch?: string | null;
        } | null) =>
          row
            ? {
                headline: row.headline ?? "",
                bio: row.bio ?? "",
                pitch: row.pitch ?? "",
              }
            : null;

        // No locale → full detail across locales (good for "@about show detail").
        if (!args.locale) {
          const byLocale = Object.fromEntries(
            LOCALES.map((loc) => [
              loc,
              pick((about as any)[localeKey(loc)] ?? null),
            ])
          );
          return {
            ok: true,
            summary: "About (all locales)",
            data: { locales: byLocale },
          };
        }

        const locale = String(args.locale);
        const row =
          (about as any)[localeKey(locale)] || about.translationEn;
        return {
          ok: true,
          summary: `About (${locale})`,
          data: { locale, ...pick(row) },
        };
      }

      case "update_about_field": {
        const locale = String(args.locale || "en");
        const field = String(args.field || "");
        const value = String(args.value || "");
        if (!["headline", "bio", "pitch"].includes(field)) {
          return { ok: false, summary: "field must be headline|bio|pitch" };
        }
        let about = await getPrisma().about.findFirst();
        if (!about) {
          about = await getPrisma().about.create({ data: {} });
        }
        const rel = localeKey(locale);
        await (getPrisma() as any).about.update({
          where: { id: about.id },
          data: {
            [rel]: {
              upsert: {
                create: {
                  headline: field === "headline" ? value : "",
                  bio: field === "bio" ? value : "",
                  pitch: field === "pitch" ? value : null,
                },
                update: { [field]: value },
              },
            },
          },
        });
        for (const loc of languages) revalidatePath(`/${loc}`);
        await audit(ctx, "UPDATE", "about", { locale, field });
        return {
          ok: true,
          summary: `Updated about.${field} (${locale})`,
          data: { locale, field, value: value.slice(0, 120) },
        };
      }

      case "list_inquiries": {
        const limit = Math.min(Number(args.limit) || 20, 50);
        const rows = await getPrisma().inquiry.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
        });
        return {
          ok: true,
          summary: `${rows.length} inquiries`,
          data: rows.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            source: r.source,
            message: (r.message || "").slice(0, 200),
            createdAt: r.createdAt.toISOString(),
          })),
        };
      }

      case "summarize_inquiries": {
        const rows = await getPrisma().inquiry.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        const bySource: Record<string, number> = {};
        for (const r of rows) {
          bySource[r.source] = (bySource[r.source] || 0) + 1;
        }
        return {
          ok: true,
          summary: `${rows.length} recent inquiries`,
          data: { total: rows.length, bySource, latest: rows.slice(0, 5) },
        };
      }

      case "search_cms": {
        const query = String(args.query || "").trim();
        if (!query) return { ok: false, summary: "query required" };
        const q = query.toLowerCase();
        const projects = await getPrisma().project.findMany({
          take: 40,
          include: { translationEn: true, translationTh: true },
        });
        const hits = projects
          .filter((p) => {
            const blob = [
              p.slug,
              p.translationEn?.title,
              p.translationEn?.description,
              p.translationTh?.title,
              p.translationTh?.description,
            ]
              .join(" ")
              .toLowerCase();
            return blob.includes(q);
          })
          .slice(0, 12)
          .map((p) => ({
            type: "project",
            slug: p.slug,
            title: p.translationEn?.title || p.slug,
          }));
        return { ok: true, summary: `${hits.length} hits`, data: hits };
      }

      case "set_locale_enabled": {
        const locale = String(args.locale || "");
        const enabled = Boolean(args.enabled);
        if (!isLocale(locale)) return { ok: false, summary: "Unknown locale" };
        const access = await setLocaleEnabled(locale, enabled);
        await audit(ctx, "UPDATE", "locales", { locale, enabled });
        return {
          ok: true,
          summary: `${enabled ? "Opened" : "Closed"} locale ${locale}`,
          data: { enabled: access.enabled, disabled: access.disabled },
        };
      }

      case "create_cms_user": {
        const username = String(args.username || "")
          .trim()
          .toLowerCase();
        const email = String(args.email || "").trim().toLowerCase();
        if (!username || !email) {
          return { ok: false, summary: "username and email required" };
        }
        if (!/^[a-z0-9._-]{2,50}$/.test(username)) {
          return { ok: false, summary: "Invalid username" };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return { ok: false, summary: "Invalid email" };
        }
        const exists = await getPrisma().user.findFirst({
          where: { OR: [{ username }, { email }] },
        });
        if (exists) return { ok: false, summary: "User already exists" };
        const user = await getPrisma().user.create({
          data: { username, email },
        });
        await audit(ctx, "CREATE", "users", { username, email });
        return {
          ok: true,
          summary: `Created user ${username}`,
          data: { id: user.id, username, email },
        };
      }

      case "remember": {
        const text = String(args.text || "")
          .trim()
          .replace(/\.$/, "")
          .slice(0, 200);
        const group = String(args.group || "preferences");
        if (!text) return { ok: false, summary: "text required" };
        if (!["about", "preferences", "projects", "people"].includes(group)) {
          return { ok: false, summary: "Invalid group" };
        }
        const mem = await getPrisma().agentMemory.create({
          data: {
            text,
            group,
            sourceKind: "chat",
            sourceDate: new Date(),
          },
        });
        return {
          ok: true,
          summary: `Remembered in ${group}`,
          data: { id: mem.id, text, group },
        };
      }

      case "forget_memory": {
        const id = String(args.id || "");
        await getPrisma().agentMemory.delete({ where: { id } }).catch(() => null);
        return { ok: true, summary: `Forgot ${id}`, data: { id } };
      }

      case "search_knowledge": {
        const query = String(args.query || "");
        const topK = Number(args.topK) || 4;
        const hits = await retrieveKnowledge(query, topK);
        return {
          ok: true,
          summary: `${hits.length} chunks`,
          data: hits,
        };
      }

      default:
        return { ok: false, summary: `Unknown tool ${name}` };
    }
  } catch (err) {
    return {
      ok: false,
      summary: err instanceof Error ? err.message : "Tool failed",
    };
  }
}
