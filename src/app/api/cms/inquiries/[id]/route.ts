import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  await prisma.inquiry.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true, deleted: true });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.read === "boolean") {
    const row = await prisma.inquiry.update({
      where: { id },
      data: { read: body.read },
    });
    return NextResponse.json({ inquiry: row });
  }
  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
