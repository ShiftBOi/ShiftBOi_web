import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}
function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const rows = await prisma.activityType.findMany({ orderBy: { type: "asc" } });
  return ok(rows);
}

export async function POST(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = await request.json().catch(() => null);
  if (!body?.type) return fail("type required");
  const row = await prisma.activityType.create({
    data: {
      type: String(body.type),
      color: String(body.color || "#e82434"),
    },
  });
  return ok(row);
}
