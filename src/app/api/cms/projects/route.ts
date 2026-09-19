import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  summary: z.string().min(1).max(500),
  description: z.string().min(1),
  year: z.string().max(4).nullable().optional(),
  published: z.boolean().optional(),
  techStack: z.array(z.string()).optional(),
  visibility: z.enum(["PUBLIC", "CONFIDENTIAL"]).optional(),
});

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  published: boolean;
  year: string | null;
  visibility: "PUBLIC" | "CONFIDENTIAL";
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.$queryRaw<ProjectRow[]>`
    SELECT
      id,
      slug,
      title,
      summary,
      description,
      published,
      year,
      visibility::text AS visibility,
      "sortOrder",
      "createdAt",
      "updatedAt"
    FROM project
    ORDER BY "sortOrder" ASC, "createdAt" DESC
  `;

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid payload" },
      { status: 400 },
    );
  }

  const id = randomUUID();
  const visibility = parsed.data.visibility ?? "PUBLIC";
  const published = parsed.data.published ?? false;
  const year = parsed.data.year || null;
  const techStack = parsed.data.techStack ?? [];
  const techStackSql =
    techStack.length === 0
      ? Prisma.sql`ARRAY[]::text[]`
      : Prisma.sql`ARRAY[${Prisma.join(techStack)}]::text[]`;

  try {
    // Raw insert so a stale Prisma Client (pre-visibility) still works after schema push.
    const created = await prisma.$queryRaw<ProjectRow[]>`
      INSERT INTO project (
        id, slug, title, summary, description, year, published,
        "techStack", visibility, "sortOrder", "createdAt", "updatedAt"
      )
      VALUES (
        ${id},
        ${parsed.data.slug},
        ${parsed.data.title},
        ${parsed.data.summary},
        ${parsed.data.description},
        ${year},
        ${published},
        ${techStackSql},
        ${visibility}::"ProjectVisibility",
        0,
        NOW(),
        NOW()
      )
      RETURNING
        id, slug, title, summary, description, published, year,
        visibility::text AS visibility, "sortOrder", "createdAt", "updatedAt"
    `;

    return NextResponse.json({ project: created[0] }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not create project. Slug may already exist." },
      { status: 409 },
    );
  }
}
