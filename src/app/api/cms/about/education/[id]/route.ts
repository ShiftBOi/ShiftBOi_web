import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { getAboutBundle, saveAboutBundle } from "@/lib/cms-about";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const bundle = await getAboutBundle();
  bundle.education = bundle.education.map((e) =>
    e.id === id
      ? {
          ...e,
          order: body.order ?? e.order,
          degree: body.translationEn?.degree ?? e.degree,
          institution: body.translationEn?.institution ?? e.institution,
          field: body.translationEn?.field ?? e.field,
        }
      : e,
  );
  await saveAboutBundle(bundle);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  const bundle = await getAboutBundle();
  bundle.education = bundle.education.filter((e) => e.id !== id);
  await saveAboutBundle(bundle);
  return NextResponse.json({ success: true });
}
