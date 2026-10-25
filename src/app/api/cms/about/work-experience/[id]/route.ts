import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { getAboutBundle, saveAboutBundle } from "@/lib/cms-about";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const bundle = await getAboutBundle();
  bundle.work = bundle.work.map((w) =>
    w.id === id
      ? {
          ...w,
          order: body.order ?? w.order,
          year: body.year ?? w.year,
          title: body.translationEn?.title ?? w.title,
          company: body.translationEn?.company ?? w.company,
          description: body.translationEn?.description ?? w.description,
        }
      : w,
  );
  await saveAboutBundle(bundle);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  const bundle = await getAboutBundle();
  bundle.work = bundle.work.filter((w) => w.id !== id);
  await saveAboutBundle(bundle);
  return NextResponse.json({ success: true });
}
