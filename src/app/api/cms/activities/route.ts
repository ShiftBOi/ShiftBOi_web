import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";

export const runtime = "nodejs";

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}
function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const rows = await prisma.activity.findMany({
    orderBy: { publishedAt: "desc" },
    include: { activityType: true },
  });
  return ok(
    rows.map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      coverImage: n.coverImage,
      isPublished: n.isPublished,
      publishedAt: n.publishedAt.toISOString(),
      detail: n.detail,
      activityType: n.activityType
        ? {
            id: n.activityType.id,
            type: n.activityType.type,
            color: n.activityType.color,
          }
        : null,
    })),
  );
}

export async function POST(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = await request.json().catch(() => null);
  if (!body?.title) return fail("title required");
  const slug =
    String(body.slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `activity-${Date.now()}`;
  const row = await prisma.activity.create({
    data: {
      title: String(body.title),
      slug,
      detail: body.detail ? String(body.detail) : null,
      coverImage: body.coverImage ? String(body.coverImage) : null,
      isPublished: Boolean(body.isPublished),
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      activityTypeId: body.activityTypeId || null,
    },
    include: { activityType: true },
  });
  return ok(row);
}
