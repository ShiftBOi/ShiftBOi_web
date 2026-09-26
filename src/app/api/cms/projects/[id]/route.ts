import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/constants";

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAllowedAdminEmail(session.user.email)) {
    return null;
  }
  return session;
}

const mediaSchema = z
  .object({
    type: z.enum(["image", "video"]),
    src: z.string().min(1),
    poster: z.string().optional(),
    colorSrc: z.string().optional(),
    bwSrc: z.string().optional(),
    objectPosition: z.string().optional(),
  })
  .nullable()
  .optional();

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  summary: z.string().min(1).max(500).optional(),
  description: z.string().min(1).optional(),
  year: z.string().max(4).nullable().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  techStack: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  visibility: z.enum(["PUBLIC", "CONFIDENTIAL"]).optional(),
  coverImage: z.string().nullable().optional(),
  introSrc: z.string().nullable().optional(),
  titleIcon: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  thesisLead: z.string().nullable().optional(),
  thesisHighlight: z.string().nullable().optional(),
  thesisRest: z.string().nullable().optional(),
  thesisBody: z.string().nullable().optional(),
  heroMetric: z.string().nullable().optional(),
  heroMetricLabel: z.string().nullable().optional(),
  heroTitle: z.string().nullable().optional(),
  heroBody: z.string().nullable().optional(),
  media: mediaSchema,
  bands: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
        media: z
          .object({
            type: z.enum(["image", "video"]),
            src: z.string().min(1),
            poster: z.string().optional(),
          })
          .nullable(),
      }),
    )
    .optional(),
  details: z
    .array(
      z.union([
        z.object({
          id: z.string(),
          kind: z.literal("highlight"),
          metric: z.string(),
          label: z.string(),
          title: z.string(),
          body: z.string(),
        }),
        z.object({
          id: z.string(),
          kind: z.literal("section"),
          label: z.string(),
          title: z.string(),
          paragraphs: z.array(z.string()),
          bullets: z.array(z.string()).nullish(),
        }),
      ]),
    )
    .optional(),
  highlights: z
    .array(
      z.object({
        metric: z.string(),
        label: z.string(),
        title: z.string(),
        body: z.string(),
      }),
    )
    .optional(),
  sections: z
    .array(
      z.object({
        label: z.string(),
        title: z.string(),
        paragraphs: z.array(z.string()),
        bullets: z.array(z.string()).nullish(),
      }),
    )
    .optional(),
});

function asJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId ?? "").trim();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { asMedia, resolveBands, resolveDetails, splitDetails } = await import(
    "@/lib/project-draft"
  );
  const media = asMedia(project.media);
  const details = resolveDetails({
    details: project.details,
    highlights: project.highlights,
    sections: project.sections,
  });
  const split = splitDetails(details);

  return NextResponse.json({
    project: {
      id: project.id,
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      description: project.description,
      year: project.year,
      role: project.role,
      coverImage: project.coverImage,
      introSrc: project.introSrc,
      titleIcon: project.titleIcon,
      thesisLead: project.thesisLead,
      thesisHighlight: project.thesisHighlight,
      thesisRest: project.thesisRest,
      thesisBody: project.thesisBody,
      heroMetric: project.heroMetric,
      heroMetricLabel: project.heroMetricLabel,
      heroTitle: project.heroTitle,
      heroBody: project.heroBody,
      media,
      bands: resolveBands({
        bands: project.bands,
        media,
        heroTitle: project.heroTitle,
        heroBody: project.heroBody,
      }),
      details,
      techStack: project.techStack,
      visibility: project.visibility,
      featured: project.featured,
      published: project.published,
      highlights: split.highlights,
      sections: split.sections,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId ?? "").trim();
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.join(".") || "payload";
    return NextResponse.json(
      {
        error: `Invalid ${path}: ${issue?.message ?? "payload"}`,
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  try {
    // Resolve by id, then fall back to slug (stale / mistyped URL ids)
    let targetId = id;
    const byId = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!byId) {
      const slug = parsed.data.slug;
      if (slug) {
        const bySlug = await prisma.project.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (bySlug) targetId = bySlug.id;
      }
    }

    if (!byId && targetId === id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { media, bands, highlights, sections, details, ...rest } = parsed.data;
    const project = await prisma.project.update({
      where: { id: targetId },
      data: {
        ...rest,
        ...(media !== undefined ? { media: asJson(media) } : {}),
        ...(bands !== undefined ? { bands: asJson(bands) } : {}),
        ...(details !== undefined ? { details: asJson(details) } : {}),
        ...(highlights !== undefined ? { highlights: asJson(highlights) } : {}),
        ...(sections !== undefined ? { sections: asJson(sections) } : {}),
      },
    });
    return NextResponse.json({ project });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    if (code === "P2025") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.error("[cms/projects PATCH]", error);
    const raw = error instanceof Error ? error.message : "Failed to save project";
    // Prisma dumps the full invocation — keep only the first useful line
    const short =
      raw
        .split("\n")
        .map((l) => l.trim())
        .find((l) => /unknown argument|invalid|failed|not found/i.test(l)) ||
      "Failed to save project. Restart the dev server if you just changed the database schema.";
    return NextResponse.json({ error: short }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId ?? "").trim();

  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "P2025") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.error("[cms/projects DELETE]", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
