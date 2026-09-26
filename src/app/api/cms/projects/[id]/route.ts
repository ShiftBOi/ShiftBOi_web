import { NextRequest, NextResponse } from "next/server";
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
  media: z
    .object({
      type: z.enum(["image", "video"]),
      src: z.string().min(1),
      poster: z.string().optional(),
      colorSrc: z.string().optional(),
      bwSrc: z.string().optional(),
    })
    .nullable()
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
        bullets: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
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
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}
