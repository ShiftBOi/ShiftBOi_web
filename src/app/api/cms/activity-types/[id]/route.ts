import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";

type Params = { params: Promise<{ id: string }> };

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}
function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid body");
  try {
    const row = await prisma.activityType.update({
      where: { id },
      data: {
        ...(body.type !== undefined ? { type: String(body.type) } : {}),
        ...(body.color !== undefined ? { color: String(body.color) } : {}),
      },
    });
    return ok(row);
  } catch {
    return fail("Not found", 404);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  await prisma.activityType.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: id });
}
