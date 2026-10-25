import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { getAboutBundle, saveAboutBundle } from "@/lib/cms-about";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const bundle = await getAboutBundle();
  bundle.skills = bundle.skills.map((s) =>
    s.id === id
      ? {
          ...s,
          name: body.name ?? s.name,
          category: body.category ?? s.category,
          order: body.order ?? s.order,
        }
      : s,
  );
  await saveAboutBundle(bundle);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  const bundle = await getAboutBundle();
  bundle.skills = bundle.skills.filter((s) => s.id !== id);
  await saveAboutBundle(bundle);
  return NextResponse.json({ success: true });
}
